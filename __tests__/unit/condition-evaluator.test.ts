import { evaluateCondition } from "@/lib/services/scoring/condition-evaluator";

const ctx = {
  score: 42,
  node: { code: "D7" },
  project: { secteur: "Énergies renouvelables", dscr: 1.18, devise: "MAD" },
  evaluation: { phase: "P1" },
  dsraMois: "2,5",
};

const t = (expr: string) => evaluateCondition(expr, ctx);

describe("evaluateCondition — littéraux", () => {
  it("accepte true et false", () => {
    expect(t("true")).toEqual({ triggered: true, evaluated: true });
    expect(t("false")).toEqual({ triggered: false, evaluated: true });
    expect(t("TRUE").triggered).toBe(true);
  });

  it("refuse une condition vide sans la considérer comme vraie", () => {
    const r = evaluateCondition("", ctx);
    expect(r.triggered).toBe(false);
    expect(r.evaluated).toBe(false);
    expect(r.reason).toBe("condition vide");
  });

  it("refuse null et undefined", () => {
    expect(evaluateCondition(null, ctx).evaluated).toBe(false);
    expect(evaluateCondition(undefined, ctx).evaluated).toBe(false);
  });
});

describe("evaluateCondition — comparaisons numériques", () => {
  it("compare le score aux bornes", () => {
    expect(t("score < 50").triggered).toBe(true);
    expect(t("score > 50").triggered).toBe(false);
    expect(t("score <= 42").triggered).toBe(true);
    expect(t("score >= 43").triggered).toBe(false);
    expect(t("score == 42").triggered).toBe(true);
    expect(t("score != 42").triggered).toBe(false);
  });

  it("traite >= sans le confondre avec >", () => {
    expect(t("score >= 42")).toEqual({ triggered: true, evaluated: true });
    expect(t("score <= 41").triggered).toBe(false);
  });

  it("accepte = comme égalité", () => {
    expect(t("score = 42").triggered).toBe(true);
  });

  it("compare des décimaux sur un champ imbriqué", () => {
    expect(t("project.dscr < 1.25").triggered).toBe(true);
    expect(t("project.dscr >= 1.25").triggered).toBe(false);
  });

  it("coerce une chaîne numérique à virgule décimale", () => {
    expect(t("dsraMois < 3").triggered).toBe(true);
  });
});

describe("evaluateCondition — comparaisons textuelles", () => {
  it("compare des chaînes sans tenir compte de la casse", () => {
    expect(t('project.devise == "mad"').triggered).toBe(true);
    expect(t("project.devise != 'EUR'").triggered).toBe(true);
  });

  it("refuse un ordre sur des chaînes non numériques", () => {
    const r = t('project.devise > "EUR"');
    expect(r.evaluated).toBe(false);
    expect(r.reason).toContain("numériques");
  });

  it("gère l'appartenance à une liste", () => {
    expect(t('evaluation.phase in ["P1", "P2"]').triggered).toBe(true);
    expect(t('evaluation.phase in ["P2", "P3"]').triggered).toBe(false);
  });
});

describe("evaluateCondition — combinaisons", () => {
  it("combine avec ET et OU", () => {
    expect(t("score < 50 && project.dscr < 1.25").triggered).toBe(true);
    expect(t("score > 50 && project.dscr < 1.25").triggered).toBe(false);
    expect(t("score > 50 || project.dscr < 1.25").triggered).toBe(true);
  });

  it("donne priorité au ET sur le OU", () => {
    expect(t("false && false || true").triggered).toBe(true);
    expect(t("true || false && false").triggered).toBe(true);
  });

  it("respecte les parenthèses", () => {
    expect(t("(score > 50 || score < 50) && true").triggered).toBe(true);
    expect(t("score > 50 || (score < 50 && false)").triggered).toBe(false);
  });

  it("gère la négation", () => {
    expect(t("!(score > 50)").triggered).toBe(true);
    expect(t("!true").triggered).toBe(false);
  });
});

describe("evaluateCondition — défaillances signalées, jamais silencieuses", () => {
  it("signale un champ absent du contexte au lieu de déclencher", () => {
    const r = t("project.inexistant < 10");
    expect(r.triggered).toBe(false);
    expect(r.evaluated).toBe(false);
    expect(r.reason).toContain("inexistant");
  });

  it("signale une expression non analysable", () => {
    const r = t("score <<>> 3");
    expect(r.triggered).toBe(false);
    expect(r.evaluated).toBe(false);
    expect(r.reason).toBeTruthy();
  });

  it("refuse une expression qui n'est pas une condition", () => {
    const r = t("score");
    expect(r.triggered).toBe(false);
    expect(r.evaluated).toBe(false);
  });

  it("n'exécute aucun code hôte", () => {
    const r = evaluateCondition('process.exit(1)', ctx);
    expect(r.triggered).toBe(false);
    expect(r.evaluated).toBe(false);
  });

  it("signale du texte résiduel après une expression valide", () => {
    const r = t("score < 50 garbage");
    expect(r.evaluated).toBe(false);
  });
});
