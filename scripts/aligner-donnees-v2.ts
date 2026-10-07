/**
 * Remise en ordre des données avant le déploiement des corrections du diagnostic.
 *
 * 1. Secteurs : le moteur ne rapproche plus le secteur d'un projet par « contient ».
 *    Les projets dont le secteur (texte libre ancien) ne correspond à aucun code ou
 *    libellé exact d'un secteur V9 actif reçoivent le code du secteur que l'ancien
 *    rapprochement aurait retenu — s'il y en avait un seul candidat ; sinon ils sont
 *    listés pour correction à la main.
 * 2. Réponses : les brouillons créés avant la correction portaient la valeur par
 *    défaut du paramétrage recopiée comme réponse. Les lignes jamais modifiées
 *    (updatedAt = createdAt) et égales à la valeur par défaut sont vidées : le moteur
 *    utilisera alors la donnée automatique ou signalera la donnée manquante.
 *
 * Par défaut le script n'écrit RIEN et affiche ce qu'il ferait.
 *
 * Usage :
 *   npx tsx scripts/aligner-donnees-v2.ts             # à blanc
 *   npx tsx scripts/aligner-donnees-v2.ts --appliquer # écrit en base
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLIQUER = process.argv.includes("--appliquer");

async function secteurs() {
  const v9 = await prisma.v9Sector.findMany({ where: { isActive: true }, orderBy: [{ orderIndex: "asc" }, { code: "asc" }] });
  const exact = (t: string) =>
    v9.find((s) => s.code.toLowerCase() === t || s.label.toLowerCase() === t);
  const projets = await prisma.project.findMany({ select: { id: true, nom: true, secteur: true } });

  let corriges = 0;
  const aRevoir: string[] = [];
  for (const p of projets) {
    const t = (p.secteur ?? "").trim().toLowerCase();
    if (!t || exact(t)) continue;
    const candidats = v9.filter((s) => s.label.toLowerCase().includes(t) || t.includes(s.label.toLowerCase()));
    if (candidats.length === 1) {
      console.log(`  secteur  ${p.nom} : « ${p.secteur} » → ${candidats[0].code}`);
      if (APPLIQUER) await prisma.project.update({ where: { id: p.id }, data: { secteur: candidats[0].code } });
      corriges++;
    } else {
      aRevoir.push(`  À REVOIR ${p.nom} : « ${p.secteur} » (${candidats.length} candidat(s))`);
    }
  }
  console.log(`Secteurs : ${corriges} à aligner, ${aRevoir.length} à revoir à la main.`);
  aRevoir.forEach((l) => console.log(l));
}

async function reponsesParDefaut() {
  const lignes = await prisma.scoringEvaluationAnswer.findMany({
    where: { evaluation: { status: "brouillon" }, valueString: { not: null } },
    select: { id: true, valueString: true, createdAt: true, updatedAt: true, node: { select: { defaultValue: true } } },
  });
  const cibles = lignes.filter(
    (l) =>
      l.node?.defaultValue != null &&
      l.valueString === l.node.defaultValue &&
      l.updatedAt.getTime() === l.createdAt.getTime()
  );
  console.log(`Réponses : ${cibles.length} valeur(s) par défaut jamais modifiées à vider (brouillons uniquement).`);
  if (APPLIQUER && cibles.length > 0) {
    await prisma.scoringEvaluationAnswer.updateMany({
      where: { id: { in: cibles.map((c) => c.id) } },
      data: { valueString: null },
    });
  }
}

async function main() {
  console.log(APPLIQUER ? "MODE APPLICATION" : "MODE À BLANC (aucune écriture)");
  await secteurs();
  await reponsesParDefaut();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
