/**
 * Vocabulaire des règles de scoring.
 *
 * Le moteur ne reconnaît qu'un petit nombre de valeurs pour `ruleType` et
 * `actionType` ; toute autre valeur donnait une règle syntaxiquement valide,
 * enregistrable depuis l'administration, et sans le moindre effet au calcul.
 * Cette table est la seule définition : le moteur en dérive le comportement,
 * l'API refuse ce qui n'y figure pas, et l'éditeur n'en propose rien d'autre.
 */

export interface TypeRegle {
  code: string;
  label: string;
  /** Ce que le type déclenche réellement au calcul. */
  effet: string;
  /** Interdit l'approbation du dossier quelle que soit la note. */
  bloquant: boolean;
  /** Empêche la publication de l'évaluation. */
  bloquePublication: boolean;
}

export const TYPES_REGLE: TypeRegle[] = [
  {
    code: "NO_GO",
    label: "Rédhibitoire (NO-GO)",
    effet: "Interdit l'approbation du dossier, quelle que soit la note obtenue.",
    bloquant: true,
    bloquePublication: false,
  },
  {
    code: "HARD_STOP",
    label: "Arrêt immédiat",
    effet: "Interdit l'approbation du dossier, quelle que soit la note obtenue.",
    bloquant: true,
    bloquePublication: false,
  },
  {
    code: "BLOCK_PUBLICATION",
    label: "Blocage de publication",
    effet: "L'évaluation reste calculable mais ne peut pas être publiée.",
    bloquant: false,
    bloquePublication: true,
  },
  {
    code: "WARNING",
    label: "Alerte",
    effet: "Signale le point dans la trace et au comité, sans bloquer.",
    bloquant: false,
    bloquePublication: false,
  },
  {
    code: "INFO",
    label: "Information",
    effet: "Mention informative dans la trace de calcul.",
    bloquant: false,
    bloquePublication: false,
  },
];

export interface ActionRegle {
  code: string;
  label: string;
  effet: string;
  /** L'action n'a de sens qu'accompagnée d'un montant de malus. */
  exigeMalus: boolean;
}

export const ACTIONS_REGLE: ActionRegle[] = [
  {
    code: "APPLY_MALUS",
    label: "Appliquer un malus",
    effet: "Retranche le montant indiqué du score final.",
    exigeMalus: true,
  },
  {
    code: "SHOW_WARNING",
    label: "Afficher une alerte",
    effet: "Fait apparaître le message dans la trace, sans toucher au score.",
    exigeMalus: false,
  },
  {
    code: "REQUIRE_COMMITTEE",
    label: "Exiger un passage en comité",
    effet: "Signale au comité que le point doit être examiné, sans toucher au score.",
    exigeMalus: false,
  },
];

export const SEVERITES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type Severite = (typeof SEVERITES)[number];

export const SEVERITE_LABELS: Record<Severite, string> = {
  LOW: "Faible",
  MEDIUM: "Moyenne",
  HIGH: "Élevée",
  CRITICAL: "Critique",
};

/** Malus maximal admissible, le score étant exprimé sur 100. */
export const MALUS_MAX = 100;

export function typeRegle(code: string | null | undefined): TypeRegle | undefined {
  return TYPES_REGLE.find((t) => t.code === code);
}

export function actionRegle(code: string | null | undefined): ActionRegle | undefined {
  return ACTIONS_REGLE.find((a) => a.code === code);
}

/**
 * Une règle bloque-t-elle l'approbation ?
 *
 * La colonne `blocking` permet de rendre bloquante une règle dont le type ne l'est
 * pas ; l'inverse n'est pas possible, un NO-GO restant rédhibitoire par nature.
 */
export function estBloquante(rule: {
  ruleType?: string | null;
  blocking?: boolean | null;
}): boolean {
  return Boolean(rule.blocking) || Boolean(typeRegle(rule.ruleType)?.bloquant);
}

export function bloquePublication(rule: { ruleType?: string | null }): boolean {
  return Boolean(typeRegle(rule.ruleType)?.bloquePublication);
}

export interface ValidationRegle {
  errors: string[];
  warnings: string[];
}

/**
 * Contrôle qu'une règle aura bien l'effet que son auteur attend.
 *
 * Les combinaisons sans effet — un malus renseigné sur une action qui n'en applique
 * pas, une action de malus sans montant — sont le principal piège de cet écran :
 * elles s'enregistrent sans erreur et ne se voient jamais au calcul.
 */
export function validerRegle(rule: {
  ruleType?: string | null;
  actionType?: string | null;
  severity?: string | null;
  penaltyValue?: number | null;
}): ValidationRegle {
  const errors: string[] = [];
  const warnings: string[] = [];

  const type = typeRegle(rule.ruleType);
  if (!type) {
    errors.push(
      `Type de règle inconnu : « ${rule.ruleType ?? "(vide)"} ». ` +
        `Valeurs acceptées : ${TYPES_REGLE.map((t) => t.code).join(", ")}.`
    );
  }

  const action = actionRegle(rule.actionType);
  if (!action) {
    errors.push(
      `Action inconnue : « ${rule.actionType ?? "(vide)"} ». ` +
        `Valeurs acceptées : ${ACTIONS_REGLE.map((a) => a.code).join(", ")}.`
    );
  }

  if (rule.severity && !SEVERITES.includes(rule.severity as Severite)) {
    errors.push(
      `Sévérité inconnue : « ${rule.severity} ». ` +
        `Valeurs acceptées : ${SEVERITES.join(", ")}.`
    );
  }

  const malus = Number(rule.penaltyValue ?? 0);
  if (!Number.isFinite(malus) || malus < 0) {
    errors.push("Le malus doit être un nombre positif ou nul.");
  } else if (malus > MALUS_MAX) {
    errors.push(`Le malus ne peut pas dépasser ${MALUS_MAX} points.`);
  }

  if (action?.exigeMalus && malus === 0) {
    errors.push(
      "L'action « Appliquer un malus » exige un montant supérieur à zéro, " +
        "faute de quoi la règle se déclenchera sans aucun effet sur la note."
    );
  }
  if (action && !action.exigeMalus && malus > 0) {
    warnings.push(
      `Le malus de ${malus} points ne sera pas appliqué : l'action « ${action.label} » ` +
        "ne modifie pas le score."
    );
  }

  return { errors, warnings };
}
