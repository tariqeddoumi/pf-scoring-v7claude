/**
 * Normalisation du corps de PATCH /api/scoring/evaluations/[id]/answers.
 *
 * Deux formes sont acceptées par réponse :
 *   1. colonnes typées — { nodeId, valueString?, valueNumber?, valueBoolean?, valueDate?, comment?, ... }
 *   2. valeur unique (héritée) — { nodeId, value }, la colonne cible étant déduite du type JavaScript
 *
 * Toute entrée non enregistrable ressort dans `ignored` avec son motif. Une réponse
 * écartée en silence est ce qui a fait perdre 100 % de la saisie : ce module rend
 * l'écart explicite et vérifiable.
 */

export type IncomingAnswer = {
  nodeId?: string;
  value?: unknown;
  valueString?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  valueDate?: string | null;
  comment?: string | null;
  manualScore?: number | null;
  overrideReason?: string | null;
};

export type NormalizedAnswer = {
  nodeId: string;
  answerType: string;
  valueString: string | null;
  valueNumber: number | null;
  valueBoolean: boolean | null;
  valueDate: Date | null;
  comment: string | null;
  manualScore: number | null;
  isOverridden: boolean;
  overrideReason: string | null;
  /** Champs explicitement fournis — les autres ne doivent pas écraser l'existant. */
  touched: { comment: boolean; manualScore: boolean };
};

export type IgnoredAnswer = { nodeId?: string; reason: string };

const has = (o: IncomingAnswer, k: keyof IncomingAnswer) =>
  Object.prototype.hasOwnProperty.call(o, k) && o[k] !== undefined;

function looseToColumns(value: unknown) {
  if (typeof value === "boolean")
    return { valueString: null, valueNumber: null, valueBoolean: value, valueDate: null };
  if (typeof value === "number")
    return { valueString: null, valueNumber: value, valueBoolean: null, valueDate: null };
  if (typeof value === "string") {
    const d = new Date(value);
    const isIsoDate = /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(d.getTime());
    return isIsoDate
      ? { valueString: null, valueNumber: null, valueBoolean: null, valueDate: d }
      : { valueString: value, valueNumber: null, valueBoolean: null, valueDate: null };
  }
  return { valueString: null, valueNumber: null, valueBoolean: null, valueDate: null };
}

function typedToColumns(a: IncomingAnswer) {
  let valueDate: Date | null = null;
  if (has(a, "valueDate") && a.valueDate !== null) {
    const d = new Date(a.valueDate as string);
    if (!Number.isNaN(d.getTime())) valueDate = d;
  }
  return {
    valueString: has(a, "valueString") ? (a.valueString ?? null) : null,
    valueNumber: has(a, "valueNumber") ? (a.valueNumber ?? null) : null,
    valueBoolean: has(a, "valueBoolean") ? (a.valueBoolean ?? null) : null,
    valueDate,
  };
}

export function normalizeAnswers(
  answers: unknown,
  answerTypeByNode: Map<string, string>
): { writes: NormalizedAnswer[]; ignored: IgnoredAnswer[] } {
  const writes: NormalizedAnswer[] = [];
  const ignored: IgnoredAnswer[] = [];

  if (!Array.isArray(answers)) return { writes, ignored };

  for (const raw of answers as IncomingAnswer[]) {
    if (!raw || typeof raw !== "object" || !raw.nodeId) {
      ignored.push({ reason: "nodeId manquant" });
      continue;
    }
    const nodeId = raw.nodeId;

    const answerType = answerTypeByNode.get(nodeId);
    if (!answerType) {
      ignored.push({ nodeId, reason: "nœud inconnu dans le référentiel" });
      continue;
    }

    const typedProvided =
      has(raw, "valueString") ||
      has(raw, "valueNumber") ||
      has(raw, "valueBoolean") ||
      has(raw, "valueDate");
    const looseProvided = has(raw, "value");
    const commentProvided = has(raw, "comment");
    const manualScoreProvided = has(raw, "manualScore");

    if (!typedProvided && !looseProvided && !commentProvided && !manualScoreProvided) {
      ignored.push({ nodeId, reason: "aucune valeur ni commentaire fourni" });
      continue;
    }

    const cols = typedProvided
      ? typedToColumns(raw)
      : looseProvided
        ? looseToColumns(raw.value)
        : { valueString: null, valueNumber: null, valueBoolean: null, valueDate: null };

    writes.push({
      nodeId,
      answerType,
      ...cols,
      comment: commentProvided ? (raw.comment ?? null) : null,
      manualScore: manualScoreProvided ? (raw.manualScore ?? null) : null,
      isOverridden: !!raw.overrideReason,
      overrideReason: raw.overrideReason ?? null,
      touched: { comment: commentProvided, manualScore: manualScoreProvided },
    });
  }

  return { writes, ignored };
}
