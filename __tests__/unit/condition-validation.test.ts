import {
  evaluateCondition,
  extractConditionFields,
  validateConditionExpression,
} from "@/lib/services/scoring/condition-evaluator";

describe("validateConditionExpression", () => {
  test("accepte une condition correcte portant sur des champs inconnus", () => {
    const r = validateConditionExpression("dscrMin < 1.05 && garantieEtat == false");
    expect(r.valid).toBe(true);
    expect(r.error).toBeUndefined();
  });

  test("accepte un champ booléen utilisé seul", () => {
    // Un champ nu n'est une condition que s'il vaut un booléen : la validation ne
    // connaît pas sa valeur et ne doit pas le refuser pour autant.
    expect(validateConditionExpression("contrepartieEnDefaut").valid).toBe(true);
  });

  test("accepte les comparaisons sur des champs non numériques", () => {
    expect(validateConditionExpression('secteur in ["ENERGIE", "EAU"]').valid).toBe(true);
    expect(validateConditionExpression('paysCode != "MA"').valid).toBe(true);
  });

  test("refuse une parenthèse non fermée", () => {
    const r = validateConditionExpression("(dscrMin < 1.05");
    expect(r.valid).toBe(false);
    expect(r.error).toBeTruthy();
  });

  test("refuse du texte parasite après l'expression", () => {
    const r = validateConditionExpression("dscrMin < 1.05 et garantieEtat");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/inattendu/);
  });

  test("refuse une chaîne non terminée", () => {
    expect(validateConditionExpression('secteur == "ENERGIE').valid).toBe(false);
  });

  test("refuse une condition vide", () => {
    expect(validateConditionExpression("   ").valid).toBe(false);
    expect(validateConditionExpression(null).valid).toBe(false);
  });

  test("refuse un opérateur sans opérande droite", () => {
    expect(validateConditionExpression("dscrMin >").valid).toBe(false);
  });

  test("la validation ne change pas l'évaluation réelle", () => {
    // Le mode indulgent ne doit servir qu'à la validation : au calcul, un champ
    // absent reste un défaut signalé, pas une règle qui se déclenche.
    const r = evaluateCondition("dscrMin < 1.05", {});
    expect(r.triggered).toBe(false);
    expect(r.evaluated).toBe(false);
    expect(r.reason).toMatch(/absent du contexte/);
  });

  test("une condition valide s'évalue toujours correctement", () => {
    expect(evaluateCondition("dscrMin < 1.05", { dscrMin: 0.9 }).triggered).toBe(true);
    expect(evaluateCondition("dscrMin < 1.05", { dscrMin: 1.4 }).triggered).toBe(false);
  });
});

describe("extractConditionFields", () => {
  test("liste les champs interrogés, sans les mots réservés", () => {
    expect(
      extractConditionFields('dscrMin < 1.05 && secteur in ["ENERGIE"] && garantie == true')
    ).toEqual(["dscrMin", "garantie", "secteur"]);
  });

  test("dédoublonne et trie", () => {
    expect(extractConditionFields("a > 1 || a < 0 || b == 2")).toEqual(["a", "b"]);
  });

  test("gère les chemins pointés", () => {
    expect(extractConditionFields("projet.secteur == \"ENERGIE\"")).toEqual([
      "projet.secteur",
    ]);
  });

  test("renvoie une liste vide pour une expression illisible", () => {
    expect(extractConditionFields('secteur == "ENERGIE')).toEqual([]);
    expect(extractConditionFields("")).toEqual([]);
  });
});
