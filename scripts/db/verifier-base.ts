/**
 * Contrôle d'une base avant de la brancher sur l'application.
 *
 *   DATABASE_URL=postgresql://… npx tsx scripts/db/verifier-base.ts
 *
 * Vérifie, dans l'ordre :
 * 1. la connexion et la version de PostgreSQL (14 ou plus) ;
 * 2. que le schéma de la base correspond exactement au schéma Prisma de l'application
 *    (aucune table, colonne, clé ou index manquant ou différent) ;
 * 3. les données indispensables au fonctionnement : une version publiée du modèle,
 *    un barème de notation, au moins deux comptes actifs (séparation des fonctions) ;
 * 4. le volume de chaque table (à comparer avec l'ancienne base).
 * Code de sortie 1 au moindre point bloquant.
 */
import { execFileSync } from "child_process";
import { Prisma, PrismaClient } from "@prisma/client";

type Resultat = { ok: boolean; libelle: string; detail?: string };

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Renseignez DATABASE_URL (la base à contrôler).");
  const prisma = new PrismaClient();
  const resultats: Resultat[] = [];
  const noter = (ok: boolean, libelle: string, detail?: string) => resultats.push({ ok, libelle, detail });

  try {
    // 1. Connexion et version
    const [{ server_version: version }] = await prisma.$queryRaw<Array<{ server_version: string }>>`SHOW server_version`;
    const majeure = parseInt(version, 10);
    noter(majeure >= 14, "Connexion et version de PostgreSQL", `PostgreSQL ${version}`);

    // 2. Schéma identique au schéma Prisma
    try {
      execFileSync(
        "npx",
        ["prisma", "migrate", "diff", "--from-url", url, "--to-schema-datamodel", "prisma/schema.prisma", "--exit-code"],
        { stdio: "pipe" }
      );
      noter(true, "Schéma conforme au schéma de l'application");
    } catch (e) {
      const sortie = (e as { stdout?: Buffer }).stdout?.toString() ?? "";
      const code = (e as { status?: number }).status;
      noter(
        false,
        "Schéma conforme au schéma de l'application",
        code === 2
          ? `écarts détectés — lancez « npm run db:schema » sur une base neuve, ou examinez :\n${sortie.slice(0, 1500)}`
          : "comparaison impossible (voir le message de Prisma)"
      );
    }

    // 3. Données indispensables
    const versions = await prisma.scoringModelVersion.count({ where: { isPublished: true } });
    noter(versions === 1, "Une version publiée du modèle", `${versions} version(s) publiée(s)`);
    const bareme = await prisma.$queryRaw<Array<{ n: bigint }>>`SELECT count(*) AS n FROM "BP_PF_v7pp_rating_scales"`;
    noter(Number(bareme[0].n) > 0, "Barème de notation renseigné", `${bareme[0].n} grade(s)`);
    const comptes = await prisma.user.count({ where: { isActive: true, deletedAt: null } });
    noter(comptes >= 2, "Au moins deux comptes actifs", `${comptes} compte(s) actif(s)`);

    // 4. Volumes
    console.log("Volumes par table :");
    for (const m of Prisma.dmmf.datamodel.models) {
      const d = (prisma as unknown as Record<string, { count: () => Promise<number> }>)[
        m.name.charAt(0).toLowerCase() + m.name.slice(1)
      ];
      const n = await d.count();
      if (n > 0) console.log(`  ${m.name.padEnd(36)} ${String(n).padStart(7)}`);
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log("\nContrôles :");
  for (const r of resultats) {
    console.log(`  ${r.ok ? "✓" : "✗"} ${r.libelle}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  if (resultats.some((r) => !r.ok)) {
    console.error("\nBase NON prête : corrigez les points marqués ✗ avant de la brancher.");
    process.exitCode = 1;
  } else {
    console.log("\nBase prête à être branchée sur l'application.");
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
