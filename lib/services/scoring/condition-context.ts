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
  /** Le chemin comporte un <CODE> à remplacer : il ne s'écrit pas tel quel. */
  gabarit?: boolean;
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

  // — Critères du modèle, adressés par leur code —
  {
    path: "criteres.<CODE>.valeur",
    label: "Valeur saisie d'un critère",
    type: "nombre",
    description:
      "Réponse saisie pour le critère dont on indique le code, par exemple " +
      "« criteres.D7_SC3_SSC1.valeur ». Remplacer <CODE> par le code du critère.",
    gabarit: true,
  },
  {
    path: "criteres.<CODE>.option",
    label: "Option retenue d'un critère",
    type: "texte",
    description:
      "Libellé de l'option choisie pour un critère à choix, par exemple " +
      "« criteres.D7_SC3_SSC1.option ».",
    gabarit: true,
  },
  {
    path: "criteres.<CODE>.score",
    label: "Score d'un critère",
    type: "nombre",
    description:
      "Score obtenu par le critère indiqué. Tous les critères sont notés avant " +
      "l'évaluation des règles : l'ordre de l'arbre n'a pas d'incidence.",
    gabarit: true,
  },
  {
    path: "criteres.<CODE>.repondu",
    label: "Critère renseigné",
    type: "booleen",
    description: "Vrai si le critère a reçu une réponse.",
    gabarit: true,
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

/**
 * Un critère du modèle, tel qu'une condition peut l'interroger.
 *
 * Les seuils métier du Project Finance — DSCR, part de fonds propres, levier — sont
 * des propriétés du dossier, pas des colonnes de la table projet. Les adresser par le
 * code du critère évite d'avoir à deviner quelle colonne héritée porte quoi, et rend
 * exprimable tout seuil dès que le critère correspondant existe au modèle.
 */
export interface CritereContext {
  /** Valeur saisie, quel que soit son type (nombre, texte, booléen). */
  valeur: string | number | boolean | null;
  /** Libellé de l'option retenue, pour les critères à choix. */
  option: string | null;
  /** Score obtenu par le critère. */
  score: number | null;
  /** Le critère a-t-il reçu une réponse ? */
  repondu: boolean;
}

/**
 * Construit le répertoire des critères, indexé par code.
 *
 * Il est bâti après le calcul de tous les nœuds : une condition posée sur un domaine
 * peut donc interroger un sous-critère, et réciproquement, sans dépendre de l'ordre
 * de parcours de l'arbre.
 */
export function buildCriteresContext(input: {
  nodes: { id: string; code: string }[];
  nodeScores: Map<string, { rawScore: number }>;
  answersByNode: Map<
    string,
    {
      valueString?: string | null;
      valueNumber?: number | null;
      valueBoolean?: boolean | null;
    }
  >;
  optionsByNode: Map<
    string,
    { value?: string | null; code?: string | null; label?: string | null }[]
  >;
}): Record<string, CritereContext> {
  const out: Record<string, CritereContext> = {};

  for (const node of input.nodes) {
    const reponse = input.answersByNode.get(node.id);
    const valeur =
      reponse?.valueNumber ?? reponse?.valueBoolean ?? reponse?.valueString ?? null;

    let option: string | null = null;
    if (reponse?.valueString) {
      const choix = (input.optionsByNode.get(node.id) ?? []).find(
        (o) => o.value === reponse.valueString || o.code === reponse.valueString
      );
      option = choix?.label ?? reponse.valueString;
    }

    out[node.code] = {
      valeur,
      option,
      score: input.nodeScores.get(node.id)?.rawScore ?? null,
      repondu: reponse !== undefined,
    };
  }

  return out;
}

export function champCondition(path: string): ChampCondition | undefined {
  return CHAMPS_CONDITION.find((c) => c.path === path);
}

/** Chemins qui s'écrivent tels quels, gabarits exclus. */
export const CHAMPS_CONCRETS = CHAMPS_CONDITION.filter((c) => !c.gabarit);

/** Racines acceptées : tout ce qui commence par l'une d'elles est interrogeable. */
const RACINES = [
  "score",
  "node",
  "projet",
  "ratios",
  "evaluation",
  "project",
  "criteres",
];

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
  criteres?: Record<string, CritereContext>;
}): ConditionContext {
  const projet = (input.project ?? {}) as Record<string, unknown>;

  return {
    score: input.score,
    node: input.node,
    projet,
    project: projet,
    criteres: input.criteres ?? {},
    ratios: {
      apportPct: pourcentage(projet.apportPropre, projet.coutTotal),
      levierPct: pourcentage(projet.financement, projet.coutTotal),
    },
    evaluation: { ...input.evaluation, malusTotal: input.malusTotal },
  };
}
