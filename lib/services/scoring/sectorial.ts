import prisma from "@/lib/prisma-client";

/**
 * Sectorial calibration helper for the live scoring engine.
 *
 * Resolves the V9 sector calibration for a project and exposes:
 *  - domain weight FACTORS (multipliers, typically 0.8–1.2) keyed by domain code (D1..D9)
 *  - the sector's red flags and stress tests (informational, surfaced in the trace)
 *
 * Reads V9 data DIRECTLY via Prisma (no relative-URL fetch), so it works
 * server-side inside route handlers and the scoring engine.
 */

export interface SectorWeighting {
  code: string;
  label: string;
  /** domainCode (D1..D9) → weight multiplier (e.g. 1.2 = +20% weight for this sector) */
  weightFactors: Map<string, number>;
  redFlags: Array<{
    code: string;
    description: string;
    isNoGo: boolean;
    penalty: number | null;
    /** Rôle dans la décision : ces alertes n'ont pas de condition paramétrée. */
    effet: "INFORMATION";
  }>;
  stressTests: Array<{ code: string; description: string; effet: "INFORMATION" }>;
}

/**
 * Resolve the sector calibration from a (possibly free-text) project sector value.
 *
 * Matching is tolerant because Project.secteur is currently a free-text field:
 *   1. exact code match (case-insensitive)  e.g. "ENR"
 *   2. exact label match (case-insensitive) e.g. "Énergies renouvelables"
 *   3. label contains the term (case-insensitive)
 *
 * Returns null when no sector is configured or no match is found (graceful degrade).
 */
/**
 * Départage les secteurs candidats, du rapprochement le plus sûr au plus approximatif.
 *
 * L'ordre est : code exact, puis libellé exact, puis libellé contenant le terme. À
 * qualité de rapprochement égale, la liste est déjà triée par orderIndex puis code,
 * de sorte que le résultat est reproductible.
 */
export function choisirSecteur<T extends { code: string; label: string }>(
  candidats: T[],
  terme: string
): T | null {
  if (candidats.length === 0) return null;
  const t = terme.trim().toLowerCase();

  // Plus de rapprochement partiel : « Eau » appliquait le profil du premier secteur
  // dont le libellé contient le mot, qui pouvait ne pas être celui du projet. Seuls
  // le code ou le libellé exacts désignent un profil ; sinon le profil manque, et le
  // moteur le signale au lieu d'en deviner un.
  return (
    candidats.find((s) => s.code.toLowerCase() === t) ??
    candidats.find((s) => s.label.toLowerCase() === t) ??
    null
  );
}

export async function resolveSectorWeighting(
  secteur: string | null | undefined
): Promise<SectorWeighting | null> {
  const term = secteur?.trim();
  if (!term) return null;

  // Le rapprochement se faisait par findFirst sur un OR incluant « contains », sans
  // tri : deux secteurs dont le libellé contient le même terme donnaient un résultat
  // arbitraire, susceptible de changer d'une requête à l'autre et donc de modifier la
  // pondération d'un dossier sans qu'aucune donnée ait bougé. On récupère tous les
  // candidats et on les départage explicitement.
  const candidats = await prisma.v9Sector.findMany({
    where: {
      isActive: true,
      OR: [
        { code: { equals: term, mode: "insensitive" } },
        { label: { equals: term, mode: "insensitive" } },
      ],
    },
    include: {
      domainWeights: true,
      redFlags: { orderBy: { orderIndex: "asc" } },
      stressTests: { orderBy: { orderIndex: "asc" } },
    },
    orderBy: [{ orderIndex: "asc" }, { code: "asc" }],
  });

  const sector = choisirSecteur(candidats, term);
  if (!sector) return null;

  return {
    code: sector.code,
    label: sector.label,
    weightFactors: new Map(
      sector.domainWeights.map((w) => [w.domainCode, w.weightAdjusted])
    ),
    redFlags: sector.redFlags.map((f) => ({
      code: f.code,
      description: f.description,
      isNoGo: f.isNoGo,
      penalty: f.penalty,
      // Les red flags sectoriels n'ont aucune condition évaluable : ils ne modifient ni
      // le score ni la décision. Ils sont restitués comme points à vérifier par
      // l'analyste — y compris ceux marqués NO_GO, qui ne bloquent RIEN tant qu'une
      // règle du modèle ne les traduit pas en condition.
      effet: "INFORMATION" as const,
    })),
    stressTests: sector.stressTests.map((s) => ({
      code: s.code,
      description: s.description,
      effet: "INFORMATION" as const,
    })),
  };
}
