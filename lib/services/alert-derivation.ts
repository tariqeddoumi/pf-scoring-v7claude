/**
 * Dérivation des alertes à partir des évaluations réelles.
 *
 * L'écran d'alertes affichait quatre alertes fabriquées, nommant des projets
 * inexistants avec des ratios inventés — « Seuil NO-GO déclenché : DSCR insuffisant
 * (1.05x < 1.1x) » pour un dossier qui n'a jamais existé. Dans un outil de décision de
 * crédit, une alerte est une donnée sur laquelle quelqu'un agit : elle ne peut venir
 * que de ce que le moteur a réellement calculé.
 *
 * Module sans accès base, pour que la règle de dérivation se teste isolément.
 */

import { SCORE_THRESHOLDS } from "@/lib/score-colors";

export type TypeAlerte =
  | "blocage"
  | "score_faible"
  | "regle_inevaluable"
  | "publication_bloquee";

export type SeveriteAlerte = "critique" | "vigilance" | "information";

export interface Alerte {
  id: string;
  type: TypeAlerte;
  severite: SeveriteAlerte;
  titre: string;
  message: string;
  evaluationId: string;
  projectId: string | null;
  projectName: string;
  /** Date du dernier calcul de l'évaluation : c'est lui qui fait foi. */
  date: string;
  lienAction: string;
}

/** Évaluation telle qu'elle est lue en base, trace comprise. */
export interface EvaluationPourAlertes {
  id: string;
  projectId: string | null;
  projectName: string;
  status: string;
  finalScore: number | null;
  rating: string | null;
  updatedAt: Date | string;
  /** Contenu de summaryJson : la trace du dernier calcul. */
  summaryJson: string | null;
}

interface TraceLue {
  blockingRuleCodes?: unknown;
  ruleDiagnostics?: unknown;
  publicationBlocked?: unknown;
}

/**
 * Lit la trace sans faire confiance à sa forme.
 *
 * Une trace est un JSON produit par une version antérieure du moteur : elle peut être
 * absente, tronquée, ou ne pas comporter les champs attendus. Une alerte manquante est
 * préférable à une exception qui prive l'utilisateur de toutes les autres.
 */
function lireTrace(summaryJson: string | null): TraceLue {
  if (!summaryJson) return {};
  try {
    const brut = JSON.parse(summaryJson);
    return brut && typeof brut === "object" ? (brut as TraceLue) : {};
  } catch {
    return {};
  }
}

function codes(valeur: unknown): string[] {
  return Array.isArray(valeur) ? valeur.map(String).filter(Boolean) : [];
}

export function deriverAlertes(evaluations: EvaluationPourAlertes[]): Alerte[] {
  const alertes: Alerte[] = [];

  for (const ev of evaluations) {
    const trace = lireTrace(ev.summaryJson);
    const date = new Date(ev.updatedAt).toISOString();
    const fiche = `/evaluations/${ev.id}`;

    const bloquantes = codes(trace.blockingRuleCodes);
    if (bloquantes.length > 0) {
      alertes.push({
        id: `${ev.id}:blocage`,
        type: "blocage",
        severite: "critique",
        titre: "Seuil rédhibitoire déclenché",
        message:
          bloquantes.length === 1
            ? `La règle « ${bloquantes[0]} » interdit l'approbation de ce dossier.`
            : `${bloquantes.length} règles interdisent l'approbation de ce dossier : ` +
              `${bloquantes.join(", ")}.`,
        evaluationId: ev.id,
        projectId: ev.projectId,
        projectName: ev.projectName,
        date,
        lienAction: fiche,
      });
    }

    if (trace.publicationBlocked === true) {
      alertes.push({
        id: `${ev.id}:publication`,
        type: "publication_bloquee",
        severite: "vigilance",
        titre: "Publication bloquée",
        message: "Une règle empêche la publication de cette évaluation.",
        evaluationId: ev.id,
        projectId: ev.projectId,
        projectName: ev.projectName,
        date,
        lienAction: fiche,
      });
    }

    // Un score faible n'est signalé que si l'évaluation a effectivement été calculée :
    // une évaluation à peine ouverte vaut zéro sans que cela ait un sens.
    if (
      ev.finalScore !== null &&
      ev.finalScore < SCORE_THRESHOLDS.vigilance &&
      ev.status !== "brouillon"
    ) {
      alertes.push({
        id: `${ev.id}:score`,
        type: "score_faible",
        severite: "vigilance",
        titre: "Score sous le seuil de vigilance",
        message:
          `Score de ${ev.finalScore.toFixed(1)}/100` +
          (ev.rating ? ` (note ${ev.rating})` : "") +
          `, sous le seuil de vigilance de ${SCORE_THRESHOLDS.vigilance}.`,
        evaluationId: ev.id,
        projectId: ev.projectId,
        projectName: ev.projectName,
        date,
        lienAction: fiche,
      });
    }

    const diagnostics = Array.isArray(trace.ruleDiagnostics)
      ? trace.ruleDiagnostics
      : [];
    if (diagnostics.length > 0) {
      alertes.push({
        id: `${ev.id}:diagnostics`,
        type: "regle_inevaluable",
        severite: "information",
        titre: "Règles non évaluées",
        message:
          `${diagnostics.length} règle${diagnostics.length > 1 ? "s n'ont" : " n'a"} ` +
          `pas pu être évaluée${diagnostics.length > 1 ? "s" : ""} lors du dernier ` +
          `calcul : la protection attendue n'a pas joué.`,
        evaluationId: ev.id,
        projectId: ev.projectId,
        projectName: ev.projectName,
        date,
        lienAction: fiche,
      });
    }
  }

  const rang: Record<SeveriteAlerte, number> = {
    critique: 0,
    vigilance: 1,
    information: 2,
  };

  return alertes.sort(
    (a, b) =>
      rang[a.severite] - rang[b.severite] ||
      new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export const LIBELLES_SEVERITE: Record<SeveriteAlerte, string> = {
  critique: "Critique",
  vigilance: "Vigilance",
  information: "Information",
};

export const LIBELLES_TYPE: Record<TypeAlerte, string> = {
  blocage: "Seuil rédhibitoire",
  score_faible: "Score faible",
  regle_inevaluable: "Règle non évaluée",
  publication_bloquee: "Publication bloquée",
};
