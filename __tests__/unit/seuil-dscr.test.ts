import { ScoreCalculator } from "@/lib/services/scoring/score-calculator";
import {
  buildConditionContext,
  buildCriteresContext,
} from "@/lib/services/scoring/condition-context";
import {
  evaluateCondition,
  validateConditionExpression,
} from "@/lib/services/scoring/condition-evaluator";
import { estBloquante } from "@/lib/services/scoring/rule-vocabulary";

/**
 * Configuration du critère DSCR telle qu'elle est enregistrée en version 5 du modèle.
 *
 * Le DSCR était capté comme un choix d'option : le seuil « ≥ 1,30x » ne vivait que
 * dans le texte descriptif du critère, et aucune règle ne pouvait s'y référer. La
 * valeur est désormais saisie, notée par plages, et un seuil rédhibitoire s'exprime
 * contre elle. Ce test fige la grille livrée : la modifier doit être un acte délibéré.
 */
const PLAGES_DSCR = [
  { min: 1.5, max: 999, score: 10 },
  { min: 1.3, max: 1.4999, score: 8 },
  { min: 1.2, max: 1.2999, score: 5 },
  { min: 0, max: 1.1999, score: 2 },
];

const CONDITION_NOGO = "criteres.D7_SC3_SSC1.valeur < 1.10";

function contexteAvecDscr(dscr: number | null) {
  const criteres = buildCriteresContext({
    nodes: [{ id: "n-dscr", code: "D7_SC3_SSC1" }],
    nodeScores: new Map([["n-dscr", { rawScore: 0 }]]),
    answersByNode:
      dscr === null
        ? new Map()
        : new Map<string, { valueNumber: number }>([
            ["n-dscr", { valueNumber: dscr }],
          ]),
    optionsByNode: new Map(),
  });

  return buildConditionContext({
    score: 0,
    node: { code: "D7_SC3", label: "Debt Service Capacity", depth: 1 },
    project: {},
    evaluation: {},
    malusTotal: 0,
    criteres,
  });
}

describe("notation du DSCR par plages", () => {
  test.each([
    [1.6, 10],
    [1.5, 10],
    [1.45, 8],
    [1.3, 8],
    [1.25, 5],
    [1.2, 5],
    [1.05, 2],
    [0, 2],
  ])("un DSCR de %s vaut %s points", (dscr, attendu) => {
    expect(ScoreCalculator.scoreFromRanges(dscr, PLAGES_DSCR).rawScore).toBe(attendu);
  });

  test("un DSCR exceptionnel reste au maximum, il ne retombe pas à zéro", () => {
    expect(ScoreCalculator.scoreFromRanges(4.5, PLAGES_DSCR).rawScore).toBe(10);
  });

  test("les plages couvrent l'échelle sans recouvrement", () => {
    const triees = [...PLAGES_DSCR].sort((a, b) => a.min - b.min);
    for (let i = 1; i < triees.length; i++) {
      expect(triees[i].min).toBeGreaterThan(triees[i - 1].max);
    }
  });
});

describe("seuil rédhibitoire sur le DSCR", () => {
  test("la condition livrée est syntaxiquement valide", () => {
    expect(validateConditionExpression(CONDITION_NOGO).valid).toBe(true);
  });

  test("se déclenche sous 1,10x", () => {
    expect(evaluateCondition(CONDITION_NOGO, contexteAvecDscr(1.05)).triggered).toBe(
      true
    );
  });

  test("ne se déclenche pas à 1,10x ni au-dessus", () => {
    expect(evaluateCondition(CONDITION_NOGO, contexteAvecDscr(1.1)).triggered).toBe(
      false
    );
    expect(evaluateCondition(CONDITION_NOGO, contexteAvecDscr(1.35)).triggered).toBe(
      false
    );
  });

  test("un DSCR non saisi ne déclenche pas le blocage", () => {
    // Une absence de réponse n'est pas un mauvais DSCR : la règle doit être signalée
    // comme non évaluable, jamais bloquer un dossier simplement inachevé.
    const verdict = evaluateCondition(CONDITION_NOGO, contexteAvecDscr(null));
    expect(verdict.triggered).toBe(false);
    expect(verdict.evaluated).toBe(false);
  });

  test("le type NO_GO rend la règle bloquante", () => {
    expect(estBloquante({ ruleType: "NO_GO", blocking: true })).toBe(true);
  });

  test("le seuil rédhibitoire est plus bas que la plus mauvaise plage notée", () => {
    // Un DSCR de 1,15x est mauvais (2 points sur 10) sans être rédhibitoire :
    // la note et le plancher d'acceptabilité sont deux décisions distinctes.
    expect(evaluateCondition(CONDITION_NOGO, contexteAvecDscr(1.15)).triggered).toBe(
      false
    );
    expect(ScoreCalculator.scoreFromRanges(1.15, PLAGES_DSCR).rawScore).toBe(2);
  });
});
