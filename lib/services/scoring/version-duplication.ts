import prisma from "@/lib/prisma-client";
import { Prisma } from "@prisma/client";

/**
 * Duplication d'une version du modèle de scoring.
 *
 * L'outil savait créer une version, mais vide : la version 2 du modèle en production
 * est restée à zéro nœud, faute de pouvoir être remplie. Sans duplication, faire
 * évoluer le modèle suppose de modifier la version publiée — celle contre laquelle des
 * dossiers ont déjà été notés — ce qui prive le versionnement de tout intérêt.
 *
 * La copie est intégrale : nœuds, options, plages, règles et liaisons de données.
 * Les identifiants de la copie sont dérivés de ceux de l'origine par un condensé
 * déterministe, de sorte que les liens parent-enfant et les rattachements de règles se
 * remappent sans table de correspondance, et que l'opération est rejouable à
 * l'identique.
 */

export interface ResultatDuplication {
  versionId: string;
  versionNumber: number;
  noeuds: number;
  options: number;
  plages: number;
  regles: number;
  liaisons: number;
}

/**
 * Identifiant dérivé, stable : md5(ancien identifiant + version cible) mis en forme
 * d'UUID. Deux exécutions sur la même version cible produisent les mêmes
 * identifiants, ce qui rend la duplication idempotente.
 */
function sqlIdDerive(colonne: string, versionCible: string): Prisma.Sql {
  return Prisma.sql`(
    substr(md5(${Prisma.raw(colonne)} || ${versionCible}), 1, 8) || '-' ||
    substr(md5(${Prisma.raw(colonne)} || ${versionCible}), 9, 4) || '-' ||
    substr(md5(${Prisma.raw(colonne)} || ${versionCible}), 13, 4) || '-' ||
    substr(md5(${Prisma.raw(colonne)} || ${versionCible}), 17, 4) || '-' ||
    substr(md5(${Prisma.raw(colonne)} || ${versionCible}), 21, 12)
  )`;
}

export async function duplicateVersion(input: {
  sourceVersionId: string;
  label?: string;
  changeReason?: string;
  createdBy: string;
}): Promise<ResultatDuplication> {
  const source = await prisma.scoringModelVersion.findUnique({
    where: { id: input.sourceVersionId },
  });
  if (!source) {
    throw new Error(`Version introuvable : ${input.sourceVersionId}`);
  }

  const dernier = await prisma.scoringModelVersion.findFirst({
    where: { modelId: source.modelId },
    orderBy: { versionNumber: "desc" },
    select: { versionNumber: true },
  });
  const versionNumber = (dernier?.versionNumber ?? 0) + 1;

  const cible = await prisma.scoringModelVersion.create({
    data: {
      modelId: source.modelId,
      versionNumber,
      label: input.label || `v${versionNumber}`,
      status: "DRAFT",
      isPublished: false,
      changeReason:
        input.changeReason ?? `Copie de la version ${source.versionNumber}`,
      createdBy: input.createdBy,
    },
  });

  const id = (colonne: string) => sqlIdDerive(colonne, cible.id);

  // La copie est transactionnelle : une version à moitié dupliquée serait un modèle
  // incohérent, avec des nœuds orphelins et des règles rattachées à rien.
  const [noeuds, options, plages, regles, liaisons] = await prisma.$transaction([
    prisma.$executeRaw`
      INSERT INTO "BP_PF_v7pp_scoring_nodes" (
        id, "versionId", "parentNodeId", "nodeType", code, label, "shortLabel",
        description, "helpText", "displayPath", depth, "orderIndex", "isActive",
        "isTerminal", "isScored", "isMandatory", "allowsChildren", weight,
        "weightMode", "aggregationMethod", "answerType", "scoringMethod",
        "scoreMin", "scoreMax", "defaultValue", unit, currency, "uiSchemaJson",
        "metadataJson", "scoreLeafDepth", "isScoringLeaf", "createdAt", "updatedAt"
      )
      SELECT ${id("n.id")}, ${cible.id},
             CASE WHEN n."parentNodeId" IS NULL THEN NULL
                  ELSE ${id('n."parentNodeId"')} END,
             n."nodeType", n.code, n.label, n."shortLabel", n.description,
             n."helpText", n."displayPath", n.depth, n."orderIndex", n."isActive",
             n."isTerminal", n."isScored", n."isMandatory", n."allowsChildren",
             n.weight, n."weightMode", n."aggregationMethod", n."answerType",
             n."scoringMethod", n."scoreMin", n."scoreMax", n."defaultValue",
             n.unit, n.currency, n."uiSchemaJson", n."metadataJson",
             n."scoreLeafDepth", n."isScoringLeaf", NOW(), NOW()
      FROM "BP_PF_v7pp_scoring_nodes" n
      WHERE n."versionId" = ${input.sourceVersionId}
      -- Les nœuds référencent leur parent : insérés dans le désordre, un enfant
      -- précéderait son parent et la contrainte d'intégrité rejetterait la ligne.
      ORDER BY n.depth ASC
    `,
    prisma.$executeRaw`
      INSERT INTO "BP_PF_v7pp_scoring_options" (
        id, "nodeId", code, label, value, score, "riskLevel", color,
        "orderIndex", "isDefault", "isActive", "metadataJson", "createdAt", "updatedAt"
      )
      SELECT ${id("o.id")}, ${id('o."nodeId"')}, o.code, o.label, o.value, o.score,
             o."riskLevel", o.color, o."orderIndex", o."isDefault", o."isActive",
             o."metadataJson", NOW(), NOW()
      FROM "BP_PF_v7pp_scoring_options" o
      JOIN "BP_PF_v7pp_scoring_nodes" n ON n.id = o."nodeId"
      WHERE n."versionId" = ${input.sourceVersionId}
    `,
    prisma.$executeRaw`
      INSERT INTO "BP_PF_v7pp_scoring_ranges" (
        id, "nodeId", label, "minValue", "maxValue", "minIncluded", "maxIncluded",
        score, color, "orderIndex", "isActive", "createdAt", "updatedAt"
      )
      SELECT ${id("r.id")}, ${id('r."nodeId"')}, r.label, r."minValue", r."maxValue",
             r."minIncluded", r."maxIncluded", r.score, r.color, r."orderIndex",
             r."isActive", NOW(), NOW()
      FROM "BP_PF_v7pp_scoring_ranges" r
      JOIN "BP_PF_v7pp_scoring_nodes" n ON n.id = r."nodeId"
      WHERE n."versionId" = ${input.sourceVersionId}
    `,
    prisma.$executeRaw`
      INSERT INTO "BP_PF_v7pp_scoring_rules" (
        id, "nodeId", "versionId", "ruleType", code, label, description,
        "conditionExpression", severity, "actionType", "penaltyValue", blocking,
        "messageUser", "messageCommittee", "orderIndex", "isActive",
        "createdAt", "updatedAt"
      )
      SELECT ${id("ru.id")},
             CASE WHEN ru."nodeId" IS NULL THEN NULL ELSE ${id('ru."nodeId"')} END,
             ${cible.id}, ru."ruleType", ru.code, ru.label, ru.description,
             ru."conditionExpression", ru.severity, ru."actionType",
             ru."penaltyValue", ru.blocking, ru."messageUser", ru."messageCommittee",
             ru."orderIndex", ru."isActive", NOW(), NOW()
      FROM "BP_PF_v7pp_scoring_rules" ru
      WHERE ru."versionId" = ${input.sourceVersionId}
    `,
    prisma.$executeRaw`
      INSERT INTO "BP_PF_v7pp_node_data_bindings" (
        id, "nodeId", "sourceEntity", "sourceField", "sourcePath", "bindingMode",
        "dataType", "transformType", "transformConfigJson", "defaultValue",
        "fallbackValue", "fallbackMessage", "isRequired", "isReadOnly",
        "allowOverride", "overrideRequiresReason", priority, "isActive",
        description, "createdAt", "updatedAt"
      )
      SELECT ${id("b.id")}, ${id('b."nodeId"')}, b."sourceEntity", b."sourceField",
             b."sourcePath", b."bindingMode", b."dataType", b."transformType",
             b."transformConfigJson", b."defaultValue", b."fallbackValue",
             b."fallbackMessage", b."isRequired", b."isReadOnly", b."allowOverride",
             b."overrideRequiresReason", b.priority, b."isActive", b.description,
             NOW(), NOW()
      FROM "BP_PF_v7pp_node_data_bindings" b
      JOIN "BP_PF_v7pp_scoring_nodes" n ON n.id = b."nodeId"
      WHERE n."versionId" = ${input.sourceVersionId}
    `,
  ]);

  return {
    versionId: cible.id,
    versionNumber,
    noeuds,
    options,
    plages,
    regles,
    liaisons,
  };
}
