/**
 * Données de référence d'une base NEUVE (sans copie depuis une ancienne base) :
 * types de réponse, méthodes d'agrégation, modes de pondération, échelles de score et
 * barème de notation. Rejoue prisma/migrations/add_scoring_configuration/migration.sql,
 * écrit pour être relancé sans risque (CREATE … IF NOT EXISTS, INSERT … ON CONFLICT).
 *
 *   DATABASE_URL=postgresql://… npx tsx scripts/db/installer-reference.ts
 */
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";

export function instructionsSql(texte: string): string[] {
  return texte
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  const sql = readFileSync(join(process.cwd(), "prisma/migrations/add_scoring_configuration/migration.sql"), "utf-8");
  const prisma = new PrismaClient();
  try {
    const instructions = instructionsSql(sql);
    for (const i of instructions) await prisma.$executeRawUnsafe(i);
    console.log(`Données de référence installées (${instructions.length} instructions).`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  });
}
