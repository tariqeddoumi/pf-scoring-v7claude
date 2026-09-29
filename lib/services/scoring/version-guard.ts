import prisma from "@/lib/prisma-client";

/**
 * Protection des versions publiées.
 *
 * Rien n'empêchait de modifier la structure d'une version publiée : l'éditeur de
 * modèle chargeait la version en production (via /api/scoring/questionnaire, qui
 * renvoie la version publiée) et ses routes créaient, modifiaient ou supprimaient
 * des nœuds, des options et des plages directement dessus. Une évaluation est censée
 * être reproductible contre sa version : modifier celle-ci après coup rend fausses
 * toutes les notes déjà calculées, et prive la banque de la trace exigée par le
 * dispositif Bank Al-Maghrib.
 *
 * Le contrôle vit ici, côté serveur, pour qu'aucun écran ni aucun appel direct ne
 * puisse le contourner.
 */

/** États dans lesquels la structure d'une version ne se modifie plus. */
const ETATS_FIGES = ["PUBLISHED", "RETIRED", "ARCHIVED"] as const;

export interface VerdictVersion {
  modifiable: boolean;
  message?: string;
  /** Renseigné quand la version existe. */
  statut?: string;
}

export async function verifierVersionModifiable(
  versionId: string | null | undefined
): Promise<VerdictVersion> {
  if (!versionId) {
    return { modifiable: false, message: "Version de modèle non précisée" };
  }

  const version = await prisma.scoringModelVersion.findUnique({
    where: { id: versionId },
    select: { status: true, isPublished: true, versionNumber: true, label: true },
  });

  if (!version) {
    return { modifiable: false, message: "Version de modèle introuvable" };
  }

  const fige =
    version.isPublished ||
    (ETATS_FIGES as readonly string[]).includes(String(version.status));

  if (fige) {
    return {
      modifiable: false,
      statut: String(version.status),
      message:
        `La version ${version.label ?? version.versionNumber} est publiée : sa structure ` +
        "ne peut plus être modifiée. Dupliquez-la en brouillon pour la faire évoluer, " +
        "puis publiez la nouvelle version.",
    };
  }

  return { modifiable: true, statut: String(version.status) };
}

/** Même contrôle, à partir d'un nœud : options et plages ne connaissent que lui. */
export async function verifierNoeudModifiable(
  nodeId: string | null | undefined
): Promise<VerdictVersion> {
  if (!nodeId) return { modifiable: false, message: "Nœud non précisé" };

  const node = await prisma.scoringNode.findUnique({
    where: { id: nodeId },
    select: { versionId: true },
  });

  if (!node) return { modifiable: false, message: "Nœud introuvable" };
  return verifierVersionModifiable(node.versionId);
}

/** Même contrôle, à partir d'une option. */
export async function verifierOptionModifiable(
  optionId: string | null | undefined
): Promise<VerdictVersion> {
  if (!optionId) return { modifiable: false, message: "Option non précisée" };

  const option = await prisma.scoringNodeOption.findUnique({
    where: { id: optionId },
    select: { nodeId: true },
  });

  if (!option) return { modifiable: false, message: "Option introuvable" };
  return verifierNoeudModifiable(option.nodeId);
}

/** Même contrôle, à partir d'une plage de valeurs. */
export async function verifierPlageModifiable(
  rangeId: string | null | undefined
): Promise<VerdictVersion> {
  if (!rangeId) return { modifiable: false, message: "Plage non précisée" };

  const range = await prisma.scoringNodeRange.findUnique({
    where: { id: rangeId },
    select: { nodeId: true },
  });

  if (!range) return { modifiable: false, message: "Plage introuvable" };
  return verifierNoeudModifiable(range.nodeId);
}
