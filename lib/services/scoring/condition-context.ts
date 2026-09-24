/**
 * Vocabulaire des conditions de règles.
 *
 * Le moteur versait jusqu'ici l'enregistrement projet et l'enregistrement évaluation
 * en vrac dans le contexte : une condition pouvait interroger n'importe quelle colonne,
 * y compris des identifiants techniques, et l'administrateur n'avait aucun moyen de
 * savoir ce qui existait. Une condition portant sur un champ inexistant s'enregistrait
 * sans bruit et ne se déclenchait jamais.
 *
 * Ce module déclare les champs interrogeables, et calcule ceux que la grammaire ne
 * sait pas exprimer : elle ne comporte pas d'arithmétique, si bien qu'un seuil du type
 * « apport propre ≥ 20 % du coût total » doit être fourni tout calculé.
 */

import type { ConditionContext } from "./condition-evaluator";

export type TypeChamp = "nombre" | "texte" | "booleen" | "pourcentage";

export interface ChampCondition {
  /** Chemin à écrire dans la condition, par exemple « projet.montant ». */
  path: string;
  label: string;
  type: TypeChamp;
  description: string;
  /** Champ calculé par le moteur plutôt que lu tel quel en base. */
  derive?: boolean;
}

export const CHAMPS_CONDITION: ChampCondition[] = [
  // — Nœud en cours d'évaluation —
  {
    path: "score",
    label: "Score du nœud",
    type: "nombre",
    description: "Score brut du critère auquel la règle est rattachée, sur 100.",
  },
  {
    path: "node.code",
    label: "Code du nœud",
    type: "texte",
    description: "Code du critère auquel la règle est rattachée.",
  },
  {
    path: "node.depth",
    label: "Profondeur du nœud",
    type: "nombre",
    description: "0 pour un domaine, 1 pour un critère, 2 pour un sous-critère.",
  },

  // — Caractéristiques du projet —
  {
    path: "projet.secteur",
    label: "Secteur",
    type: "texte",
    description: "Secteur d'activité du projet.",
  },
  {
    path: "projet.pays",
    label: "Pays",
    type: "texte",
    description: "Pays d'implantation.",
  },
  {
    path: "projet.countryCode",
    label: "Code pays",
    type: "texte",
    description: "Code ISO du pays d'implantation (« MA » pour le Maroc).",
  },
  {
    path: "projet.montant",
    label: "Montant du financement",
    type: "nombre",
    description: "Montant sollicité, en MAD.",
  },
  {
    path: "projet.coutTotal",
    label: "Coût total du projet",
    type: "nombre",
    description: "Coût total d'investissement, en MAD.",
  },
  {
    path: "projet.apportPropre",
    label: "Apport propre",
    type: "nombre",
    description: "Fonds propres apportés par les sponsors, en MAD.",
  },
  {
    path: "projet.dureeCredit",
    label: "Durée du crédit",
    type: "nombre",
    description: "Durée du crédit, en années.",
  },
  {
    path: "projet.dureeProjet",
    label: "Durée du projet",
    type: "nombre",
    description: "Durée de vie du projet, en années.",
  },
  {
    path: "projet.taux",
    label: "Taux",
    type: "nombre",
    description: "Taux d'intérêt appliqué.",
  },
  {
    path: "projet.tauxCouverture",
    label: "Taux de couverture",
    type: "nombre",
    description: "Taux de couverture du service de la dette tel que saisi au projet.",
  },
  {
    path: "projet.technologie",
    label: "Technologie",
    type: "texte",
    description: "Technologie retenue, le cas échéant.",
  },
  {
    path: "projet.capaciteInstallee",
    label: "Capacité installée",
    type: "nombre",
    description: "Capacité installée du projet.",
  },

  // — Ratios calculés —
  {
    path: "ratios.apportPct",
    label: "Part de fonds propres",
    type: "pourcentage",
    description:
      "Apport propre rapporté au coût total, en pourcentage. Calculé par le moteur : " +
      "la grammaire des conditions ne comporte pas de division.",
    derive: true,
  },
  {
    path: "ratios.levierPct",
    label: "Levier",
    type: "pourcentage",
    description:
      "Financement rapporté au coût total, en pourcentage. Calculé par le moteur.",
    derive: true,
  },

  // — Évaluation en cours —
  {
    path: "evaluation.status",
    label: "Statut de l'évaluation",
    type: "texte",
    description: "brouillon, soumise, validee, approuvee ou rejetee.",
  },
  {
    path: "evaluation.malusTotal",
    label: "Malus cumulé",
    type: "nombre",
    description: "Total des malus déjà appliqués au moment de l'évaluation du nœud.",
  },
];

export function champCondition(path: string): ChampCondition | undefined {
  return CHAMPS_CONDITION.find((c) => c.path === path);
}

/** Racines acceptées : tout ce qui commence par l'une d'elles est interrogeable. */
const RACINES = ["score", "node", "projet", "ratios", "evaluation", "project"];

/**
 * Le champ figure-t-il au catalogue, ou du moins sous une racine connue ?
 *
 * La tolérance sur les racines est délibérée : le contexte expose l'intégralité des
 * enregistrements projet et évaluation, et une condition portant sur une colonne non
 * cataloguée reste valide. Seul ce qui ne relève d'aucune racine est franchement faux.
 */
export function champReconnu(path: string): boolean {
  if (champCondition(path)) return true;
  const racine = path.split(".")[0];
  return RACINES.includes(racine);
}

function pourcentage(numerateur: unknown, denominateur: unknown): number | null {
  const n = Number(numerateur);
  const d = Number(denominateur);
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return null;
  return (n / d) * 100;
}

/**
 * Construit le contexte d'évaluation d'une règle.
 *
 * `projet` est l'alias francophone de `project`, conservé pour les conditions déjà
 * enregistrées. Les ratios valent `null` lorsqu'ils ne sont pas calculables : une
 * condition qui les interroge sera alors signalée comme non évaluable, plutôt que de
 * se déclencher sur un zéro inventé.
 */
export function buildConditionContext(input: {
  score: number;
  node: { code: string; label: string; depth: number };
  project: Record<string, unknown> | null | undefined;
  evaluation: Record<string, unknown>;
  malusTotal: number;
}): ConditionContext {
  const projet = (input.project ?? {}) as Record<string, unknown>;

  return {
    score: input.score,
    node: input.node,
    projet,
    project: projet,
    ratios: {
      apportPct: pourcentage(projet.apportPropre, projet.coutTotal),
      levierPct: pourcentage(projet.financement, projet.coutTotal),
    },
    evaluation: { ...input.evaluation, malusTotal: input.malusTotal },
  };
}
