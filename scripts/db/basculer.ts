/**
 * Kit de bascule vers une autre base PostgreSQL, en une commande.
 *
 *   npm run db:basculer -- --cible "postgresql://u:mdp@hote:5432/pfscoring"            # à blanc
 *   npm run db:basculer -- --cible "postgresql://…" --appliquer                       # nouvelle base vierge
 *   npm run db:basculer -- --cible "postgresql://…" --source "$DATABASE_URL" --appliquer   # avec reprise des données
 *
 * Étapes : 1. connexion et version de la base cible (PostgreSQL 14+) ;
 *          2. création du schéma (prisma db push) ;
 *          3. reprise des données de la base source (db:copier), ou installation des
 *             référentiels (db:installer-reference) pour une base vierge ;
 *          4. contrôle de conformité (db:verifier) ;
 *          5. indication de ce qu'il reste à changer (variable DATABASE_URL, redéploiement).
 * Sans --appliquer, rien n'est écrit : seules les vérifications et le plan s'affichent.
 * Les secrets ne sont jamais affichés (identifiants masqués).
 */
import { spawnSync } from "child_process";
import { PrismaClient } from "@prisma/client";

function argument(nom: string): string | undefined {
  const i = process.argv.indexOf(`--${nom}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

export function masquer(url: string): string {
  try {
    const u = new URL(url);
    if (u.password) u.password = "****";
    return u.toString();
  } catch {
    return "(adresse illisible)";
  }
}

function etape(n: number, texte: string) {
  console.log(`\n── ${n}. ${texte}`);
}

function lancer(commande: string, args: string[], env: Record<string, string>): void {
  const r = spawnSync(commande, args, { stdio: "inherit", env: { ...process.env, ...env }, shell: process.platform === "win32" });
  if (r.status !== 0) {
    console.error(`\n✗ Échec de : ${commande} ${args.join(" ")}`);
    process.exit(r.status ?? 1);
  }
}

async function main() {
  const cible = argument("cible");
  const source = argument("source");
  const appliquer = process.argv.includes("--appliquer");
  if (!cible) {
    console.error('Usage : npm run db:basculer -- --cible "postgresql://…" [--source "postgresql://…"] [--appliquer]');
    process.exit(2);
  }
  console.log(`Base cible  : ${masquer(cible)}`);
  console.log(`Base source : ${source ? masquer(source) : "(aucune : base vierge avec référentiels)"}`);
  console.log(appliquer ? "Mode       : APPLICATION" : "Mode       : à blanc (rien n'est écrit ; ajoutez --appliquer)");

  etape(1, "Connexion à la base cible");
  const db = new PrismaClient({ datasources: { db: { url: cible } } });
  try {
    const [{ version }] = await db.$queryRawUnsafe<Array<{ version: string }>>("SELECT current_setting('server_version') AS version");
    const majeure = Number.parseInt(version, 10);
    console.log(`  PostgreSQL ${version}`);
    if (!(majeure >= 14)) {
      console.error("  ✗ PostgreSQL 14 ou plus récent est requis.");
      process.exit(1);
    }
    const [{ n }] = await db.$queryRawUnsafe<Array<{ n: bigint }>>(
      "SELECT count(*) AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'BP_PF_%'"
    );
    console.log(`  Tables de l'application déjà présentes : ${n}`);
  } catch (e) {
    console.error(`  ✗ Connexion impossible : ${e instanceof Error ? e.message.split("\n").slice(-1)[0] : e}`);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }

  if (!appliquer) {
    console.log("\nPlan :");
    console.log("  2. créer le schéma sur la base cible (prisma db push) ;");
    console.log(source ? "  3. copier toutes les données de la base source (la cible doit être vide) ;" : "  3. installer les référentiels (grille, pays, secteurs…) ;");
    console.log("  4. vérifier la conformité de la base cible ;");
    console.log("  5. vous indiquer la variable à changer.");
    console.log("\nRelancez avec --appliquer pour exécuter.");
    return;
  }

  etape(2, "Création du schéma");
  lancer("npx", ["prisma", "db", "push", "--skip-generate"], { DATABASE_URL: cible });

  etape(3, source ? "Reprise des données" : "Installation des référentiels");
  if (source) lancer("npx", ["tsx", "scripts/db/copier-base.ts", "--appliquer"], { SOURCE_DATABASE_URL: source, DATABASE_URL: cible });
  else lancer("npx", ["tsx", "scripts/db/installer-reference.ts"], { DATABASE_URL: cible });

  etape(4, "Contrôle de conformité");
  lancer("npx", ["tsx", "scripts/db/verifier-base.ts"], { DATABASE_URL: cible });

  etape(5, "Il reste à faire");
  console.log("  • Remplacer la variable d'environnement DATABASE_URL de l'application par la base cible");
  console.log("    (Vercel : Settings › Environment Variables), puis redéployer.");
  console.log("  • Les pièces des dossiers restent dans leur stockage (Supabase Storage ou S3) : rien à déplacer.");
  console.log("  • Garder l'ancienne base en lecture le temps de valider, puis l'archiver.");
  console.log("\n✓ Bascule préparée.");
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
