import {
  CHAMPS_CONDITION,
  buildConditionContext,
  champReconnu,
} from "@/lib/services/scoring/condition-context";
import { evaluateCondition } from "@/lib/services/scoring/condition-evaluator";

const noeud = { code: "D1", label: "Sponsor", depth: 0 };

const contexte = (projet: Record<string, unknown>) =>
  buildConditionContext({
    score: 62,
    node: noeud,
    project: projet,
    evaluation: { status: "brouillon" },
    malusTotal: 5,
  });

describe("buildConditionContext", () => {
  test("expose le score du nœud et ses métadonnées", () => {
    expect(evaluateCondition("score < 70", contexte({})).triggered).toBe(true);
    expect(evaluateCondition('node.code == "D1"', contexte({})).triggered).toBe(true);
    expect(evaluateCondition("node.depth == 0", contexte({})).triggered).toBe(true);
  });

  test("calcule la part de fonds propres, que la grammaire ne sait pas diviser", () => {
    const ctx = contexte({ apportPropre: 150, coutTotal: 1000 });
    expect(evaluateCondition("ratios.apportPct < 20", ctx).triggered).toBe(true);
    expect(evaluateCondition("ratios.apportPct >= 20", ctx).triggered).toBe(false);
  });

  test("calcule le levier", () => {
    const ctx = contexte({ financement: 850, coutTotal: 1000 });
    expect(evaluateCondition("ratios.levierPct > 80", ctx).triggered).toBe(true);
  });

  test("un ratio incalculable n'est pas assimilé à zéro", () => {
    // Coût total absent : le ratio vaut null. La condition doit être signalée comme
    // non évaluable, pas se déclencher comme si l'apport était nul.
    const r = evaluateCondition("ratios.apportPct < 20", contexte({ apportPropre: 150 }));
    expect(r.triggered).toBe(false);
    expect(r.evaluated).toBe(false);
  });

  test("un coût total à zéro ne provoque pas de division par zéro", () => {
    const ctx = contexte({ apportPropre: 10, coutTotal: 0 });
    expect(evaluateCondition("ratios.apportPct < 20", ctx).evaluated).toBe(false);
  });

  test("« projet » et « project » désignent le même enregistrement", () => {
    const ctx = contexte({ secteur: "ENERGIE" });
    expect(evaluateCondition('projet.secteur == "ENERGIE"', ctx).triggered).toBe(true);
    expect(evaluateCondition('project.secteur == "ENERGIE"', ctx).triggered).toBe(true);
  });

  test("le malus cumulé est celui du calcul en cours, pas celui enregistré", () => {
    const ctx = buildConditionContext({
      score: 50,
      node: noeud,
      project: {},
      evaluation: { malusTotal: 99 },
      malusTotal: 5,
    });
    expect(evaluateCondition("evaluation.malusTotal == 5", ctx).triggered).toBe(true);
  });

  test("un projet absent ne fait pas échouer la construction", () => {
    const ctx = buildConditionContext({
      score: 50,
      node: noeud,
      project: null,
      evaluation: {},
      malusTotal: 0,
    });
    expect(evaluateCondition("score == 50", ctx).triggered).toBe(true);
  });
});

describe("champReconnu", () => {
  test("accepte tous les champs du catalogue", () => {
    for (const c of CHAMPS_CONDITION) {
      expect(champReconnu(c.path)).toBe(true);
    }
  });

  test("tolère une colonne non cataloguée sous une racine connue", () => {
    expect(champReconnu("projet.nomSPV")).toBe(true);
    expect(champReconnu("evaluation.rating")).toBe(true);
  });

  test("refuse un champ hors de toute racine", () => {
    // C'est précisément la faute que commettait l'ancien exemple de l'éditeur.
    expect(champReconnu("dscrMin")).toBe(false);
    expect(champReconnu("garantieEtat")).toBe(false);
  });
});

describe("cohérence du catalogue", () => {
  test("chaque champ déclaré est réellement présent dans le contexte", () => {
    const ctx = contexte({
      secteur: "ENERGIE",
      pays: "Maroc",
      countryCode: "MA",
      montant: 1000,
      coutTotal: 1200,
      apportPropre: 300,
      financement: 900,
      dureeCredit: 12,
      dureeProjet: 20,
      taux: 4.5,
      tauxCouverture: 1.3,
      technologie: "Solaire",
      capaciteInstallee: 120,
    });

    for (const champ of CHAMPS_CONDITION) {
      const valeur = champ.path
        .split(".")
        .reduce<unknown>(
          (cur, part) =>
            cur && typeof cur === "object"
              ? (cur as Record<string, unknown>)[part]
              : undefined,
          ctx
        );
      expect(valeur).toBeDefined();
    }
  });

  test("les chemins du catalogue sont uniques", () => {
    const chemins = CHAMPS_CONDITION.map((c) => c.path);
    expect(new Set(chemins).size).toBe(chemins.length);
  });
});
