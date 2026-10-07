/**
 * Copie toutes les données de l'application d'une base PostgreSQL à une autre.
 *
 *   SOURCE_DATABASE_URL=postgresql://…source   DATABASE_URL=postgresql://…cible \
 *     npx tsx scripts/db/copier-base.ts            # à blanc : compte ce qui serait copié
 *     npx tsx scripts/db/copier-base.ts --appliquer
 *
 * La cible doit avoir le schéma à jour (npm run db:schema) et être vide : le script
 * refuse d'écrire dans une table qui contient déjà des lignes (sauf --completer, qui
 * ignore les lignes déjà présentes, pour reprendre une copie interrompue).
 *
 * Générique : la liste des tables, leurs clés et leurs dépendances viennent du schéma
 * Prisma. Les tables sont copiées dans l'ordre des clés étrangères ; une clé qui pointe
 * vers la même table (critère parent) ou qui forme un cycle est remplie dans un
 * second temps. Aucun privilège particulier n'est requis sur la cible.
 */
import { Prisma, PrismaClient } from "@prisma/client";

const APPLIQUER = process.argv.includes("--appliquer");
const COMPLETER = process.argv.includes("--completer");
const LOT = 500;

type Modele = Prisma.DMMF.Model;

export interface PlanCopie {
  ordre: string[];
  /** modèle → champs scalaires de clé étrangère remplis au second passage */
  differes: Record<string, string[]>;
}

/** Ordre de copie selon les clés étrangères ; les références circulaires sont différées. */
export function planifier(modeles: readonly Modele[]): PlanCopie {
  const noms = new Set(modeles.map((m) => m.name));
  const dependances = new Map<string, Map<string, string[]>>(); // modèle → (cible → champs FK)
  for (const m of modeles) {
    const deps = new Map<string, string[]>();
    for (const f of m.fields) {
      if (f.kind !== "object" || !f.relationFromFields?.length) continue;
      if (!noms.has(f.type)) continue;
      deps.set(f.type, [...(deps.get(f.type) ?? []), ...f.relationFromFields]);
    }
    dependances.set(m.name, deps);
  }

  const differes: Record<string, string[]> = {};
  const ajouterDiffere = (m: string, champs: string[]) => {
    differes[m] = [...new Set([...(differes[m] ?? []), ...champs])];
  };
  // Auto-référence : toujours différée.
  for (const [m, deps] of dependances) {
    if (deps.has(m)) {
      ajouterDiffere(m, deps.get(m)!);
      deps.delete(m);
    }
  }

  const ordre: string[] = [];
  const restants = new Set(noms);
  while (restants.size > 0) {
    const prets = [...restants].filter((m) => [...dependances.get(m)!.keys()].every((d) => !restants.has(d))).sort();
    if (prets.length > 0) {
      for (const m of prets) {
        ordre.push(m);
        restants.delete(m);
      }
      continue;
    }
    // Cycle : on diffère les clés du premier modèle restant vers les autres restants.
    const m = [...restants].sort()[0];
    for (const [cible, champs] of dependances.get(m)!) {
      if (restants.has(cible)) {
        ajouterDiffere(m, champs);
        dependances.get(m)!.delete(cible);
      }
    }
  }
  return { ordre, differes };
}

const delegue = (client: PrismaClient, modele: string) =>
  (client as unknown as Record<string, Record<string, (a?: unknown) => Promise<unknown>>>)[
    modele.charAt(0).toLowerCase() + modele.slice(1)
  ];

function clePrimaire(m: Modele): string[] {
  if (m.primaryKey?.fields?.length) return [...m.primaryKey.fields];
  return m.fields.filter((f) => f.isId).map((f) => f.name);
}

function whereCle(m: Modele, ligne: Record<string, unknown>) {
  const cle = clePrimaire(m);
  if (cle.length === 1) return { [cle[0]]: ligne[cle[0]] };
  const nom = m.primaryKey?.name ?? cle.join("_");
  return { [nom]: Object.fromEntries(cle.map((c) => [c, ligne[c]])) };
}

async function main() {
  const urlSource = process.env.SOURCE_DATABASE_URL;
  const urlCible = process.env.DATABASE_URL;
  if (!urlSource || !urlCible) {
    throw new Error("Renseignez SOURCE_DATABASE_URL (base actuelle) et DATABASE_URL (nouvelle base).");
  }
  if (urlSource === urlCible) throw new Error("La source et la cible sont la même base.");

  const source = new PrismaClient({ datasources: { db: { url: urlSource } } });
  const cible = new PrismaClient({ datasources: { db: { url: urlCible } } });
  const modeles = Prisma.dmmf.datamodel.models;
  const parNom = new Map(modeles.map((m) => [m.name, m]));
  const { ordre, differes } = planifier(modeles);

  console.log(APPLIQUER ? "MODE COPIE" : "MODE À BLANC (aucune écriture)");
  console.log(`${ordre.length} tables, dans l'ordre des dépendances.\n`);

  let total = 0;
  const ecarts: string[] = [];
  try {
    // Contrôle préalable : la cible doit être vide (sauf --completer).
    if (APPLIQUER && !COMPLETER) {
      const occupees: string[] = [];
      for (const nom of ordre) {
        const n = (await delegue(cible, nom).count()) as number;
        if (n > 0) occupees.push(`${nom} (${n})`);
      }
      if (occupees.length) {
        throw new Error(
          `La base cible n'est pas vide : ${occupees.slice(0, 8).join(", ")}${occupees.length > 8 ? "…" : ""}. ` +
            "Utilisez une base vide, ou --completer pour reprendre une copie interrompue."
        );
      }
    }

    for (const nom of ordre) {
      const m = parNom.get(nom)!;
      const cle = clePrimaire(m);
      const champsDifferes = differes[nom] ?? [];
      const champsJson = m.fields.filter((f) => f.kind === "scalar" && f.type === "Json" && !f.isRequired).map((f) => f.name);
      const nSource = (await delegue(source, nom).count()) as number;
      total += nSource;
      if (!APPLIQUER) {
        console.log(`  ${nom.padEnd(36)} ${String(nSource).padStart(7)} ligne(s)`);
        continue;
      }
      const aCompleter: Array<Record<string, unknown>> = [];
      for (let decalage = 0; decalage < nSource; decalage += LOT) {
        const lignes = (await delegue(source, nom).findMany({
          skip: decalage,
          take: LOT,
          orderBy: cle.map((c) => ({ [c]: "asc" })),
        })) as Array<Record<string, unknown>>;
        const aInserer = lignes.map((brute) => {
          // Prisma lit un JSON absent (NULL SQL) comme null et le réécrirait en valeur
          // JSON « null » : on rétablit le NULL SQL.
          const l = champsJson.length
            ? { ...brute, ...Object.fromEntries(champsJson.filter((c) => brute[c] === null).map((c) => [c, Prisma.DbNull])) }
            : brute;
          if (!champsDifferes.length) return l;
          if (champsDifferes.some((c) => l[c] !== null && l[c] !== undefined)) aCompleter.push(l);
          return { ...l, ...Object.fromEntries(champsDifferes.map((c) => [c, null])) };
        });
        await delegue(cible, nom).createMany({ data: aInserer, skipDuplicates: true });
      }
      for (const l of aCompleter) {
        await delegue(cible, nom).update({
          where: whereCle(m, l),
          // Les dates @updatedAt sont réécrites à l'identique : sinon Prisma y mettrait
          // l'heure de la copie.
          data: Object.fromEntries(
            [...champsDifferes, ...m.fields.filter((f) => f.isUpdatedAt).map((f) => f.name)].map((c) => [c, l[c]])
          ),
        });
      }
      const nCible = (await delegue(cible, nom).count()) as number;
      const ok = nCible === nSource;
      if (!ok) ecarts.push(`${nom} : source ${nSource}, cible ${nCible}`);
      console.log(`  ${ok ? "✓" : "✗"} ${nom.padEnd(36)} ${String(nCible).padStart(7)} / ${nSource}`);
    }
  } finally {
    await source.$disconnect();
    await cible.$disconnect();
  }

  console.log(`\n${total} ligne(s) au total dans la source.`);
  if (ecarts.length) {
    console.error(`\n${ecarts.length} table(s) avec un écart :\n  ${ecarts.join("\n  ")}`);
    process.exitCode = 1;
  } else if (APPLIQUER) {
    console.log("Copie terminée : chaque table de la cible compte autant de lignes que la source.");
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  });
}
