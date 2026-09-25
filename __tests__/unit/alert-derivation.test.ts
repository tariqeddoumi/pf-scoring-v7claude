import {
  deriverAlertes,
  type EvaluationPourAlertes,
} from "@/lib/services/alert-derivation";

const base: EvaluationPourAlertes = {
  id: "ev1",
  projectId: "p1",
  projectName: "Parc éolien Taourirt",
  status: "soumise",
  finalScore: 72,
  rating: "BB",
  updatedAt: "2026-09-20T10:00:00.000Z",
  summaryJson: null,
};

const trace = (contenu: Record<string, unknown>) => JSON.stringify(contenu);

describe("deriverAlertes", () => {
  test("une évaluation saine ne produit aucune alerte", () => {
    expect(deriverAlertes([base])).toEqual([]);
  });

  test("un seuil rédhibitoire déclenché produit une alerte critique", () => {
    const alertes = deriverAlertes([
      { ...base, summaryJson: trace({ blockingRuleCodes: ["NOGO_DSCR_MIN"] }) },
    ]);
    expect(alertes).toHaveLength(1);
    expect(alertes[0].severite).toBe("critique");
    expect(alertes[0].message).toContain("NOGO_DSCR_MIN");
    expect(alertes[0].lienAction).toBe("/evaluations/ev1");
  });

  test("plusieurs règles bloquantes tiennent dans une seule alerte", () => {
    const alertes = deriverAlertes([
      {
        ...base,
        summaryJson: trace({
          blockingRuleCodes: ["NOGO_DSCR_MIN", "NOGO_FONDS_PROPRES"],
        }),
      },
    ]);
    expect(alertes).toHaveLength(1);
    expect(alertes[0].message).toContain("2 règles");
  });

  test("un score sous le seuil de vigilance est signalé", () => {
    const alertes = deriverAlertes([{ ...base, finalScore: 42 }]);
    expect(alertes).toHaveLength(1);
    expect(alertes[0].type).toBe("score_faible");
    expect(alertes[0].message).toContain("42");
  });

  test("un brouillon n'est pas signalé pour score faible", () => {
    // Une évaluation à peine ouverte vaut zéro sans que cela veuille dire quoi que
    // ce soit : la signaler noierait les vraies alertes.
    expect(deriverAlertes([{ ...base, status: "brouillon", finalScore: 0 }])).toEqual(
      []
    );
  });

  test("une évaluation jamais calculée n'est pas signalée", () => {
    expect(deriverAlertes([{ ...base, finalScore: null }])).toEqual([]);
  });

  test("les règles non évaluées sont remontées, la protection n'ayant pas joué", () => {
    const alertes = deriverAlertes([
      {
        ...base,
        summaryJson: trace({
          ruleDiagnostics: [{ ruleCode: "NOGO_DSCR_MIN", reason: "champ absent" }],
        }),
      },
    ]);
    expect(alertes).toHaveLength(1);
    expect(alertes[0].type).toBe("regle_inevaluable");
    expect(alertes[0].severite).toBe("information");
  });

  test("une publication bloquée est signalée", () => {
    const alertes = deriverAlertes([
      { ...base, summaryJson: trace({ publicationBlocked: true }) },
    ]);
    expect(alertes.map((a) => a.type)).toContain("publication_bloquee");
  });

  test("les alertes sont classées par gravité puis par fraîcheur", () => {
    const alertes = deriverAlertes([
      { ...base, id: "ev-info", summaryJson: trace({ ruleDiagnostics: [{}] }) },
      { ...base, id: "ev-faible", finalScore: 30 },
      {
        ...base,
        id: "ev-bloque",
        summaryJson: trace({ blockingRuleCodes: ["NOGO_X"] }),
      },
    ]);
    expect(alertes.map((a) => a.severite)).toEqual([
      "critique",
      "vigilance",
      "information",
    ]);
  });

  test("une même évaluation peut porter plusieurs alertes distinctes", () => {
    const alertes = deriverAlertes([
      {
        ...base,
        finalScore: 30,
        summaryJson: trace({
          blockingRuleCodes: ["NOGO_X"],
          ruleDiagnostics: [{}],
        }),
      },
    ]);
    expect(alertes).toHaveLength(3);
    expect(new Set(alertes.map((a) => a.id)).size).toBe(3);
  });

  test("une trace illisible ne fait pas disparaître les autres alertes", () => {
    // Une trace peut venir d'une version antérieure du moteur : elle ne doit jamais
    // interrompre la dérivation.
    const alertes = deriverAlertes([
      { ...base, id: "ev-cassee", summaryJson: "{ ceci n'est pas du JSON" },
      { ...base, id: "ev-saine", summaryJson: trace({ blockingRuleCodes: ["NOGO_X"] }) },
    ]);
    expect(alertes).toHaveLength(1);
    expect(alertes[0].evaluationId).toBe("ev-saine");
  });

  test("une trace sans les champs attendus ne produit rien plutôt que d'échouer", () => {
    expect(
      deriverAlertes([{ ...base, summaryJson: trace({ blockingRuleCodes: "NOGO_X" }) }])
    ).toEqual([]);
  });

  test("aucune alerte n'est inventée en l'absence d'évaluation", () => {
    expect(deriverAlertes([])).toEqual([]);
  });
});
