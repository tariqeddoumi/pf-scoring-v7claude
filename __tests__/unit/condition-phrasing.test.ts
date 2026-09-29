import {
  conditionEnFrancais,
  libelleChamp,
} from "@/lib/services/scoring/condition-phrasing";

describe("conditionEnFrancais", () => {
  test("traduit une comparaison sur un champ catalogué", () => {
    expect(conditionEnFrancais("ratios.apportPct < 20")).toContain("est en dessous de 20");
  });

  test("écrit les décimales à la française", () => {
    expect(conditionEnFrancais("ratios.dscrMin < 1.10")).toContain("1,10");
  });

  test("nomme le critère visé quand son libellé est connu", () => {
    const phrase = conditionEnFrancais(
      "criteres.D7_SC3_SSC1.valeur < 1.10",
      (code) => (code === "D7_SC3_SSC1" ? "DSCR minimum" : undefined)
    );
    expect(phrase).toBe("la valeur saisie pour « DSCR minimum » est en dessous de 1,10");
  });

  test("retombe sur le code quand le critère est inconnu", () => {
    expect(conditionEnFrancais("criteres.D9_SC1_SSC1.score >= 60")).toContain(
      "D9_SC1_SSC1"
    );
  });

  test("traduit la négation d'une réponse", () => {
    expect(conditionEnFrancais("!criteres.D9_SC1_SSC1.repondu")).toContain(
      "est absente"
    );
  });

  test("relie deux termes par et", () => {
    const phrase = conditionEnFrancais("ratios.apportPct < 20 && score < 50");
    expect(phrase).toContain(" et ");
  });

  test("signale une condition toujours vraie", () => {
    expect(conditionEnFrancais("true")).toMatch(/toujours vraie/);
  });

  test("renonce plutôt que de déformer une expression parenthésée", () => {
    // Une phrase approximative sur une règle de crédit vaut moins que l'expression
    // elle-même : on rend la main à l'affichage technique.
    expect(conditionEnFrancais("(a > 1 || b < 2) && c")).toBeNull();
  });

  test("ne traduit rien d'une expression vide", () => {
    expect(conditionEnFrancais("")).toBeNull();
    expect(conditionEnFrancais(null)).toBeNull();
  });
});

describe("libelleChamp", () => {
  test("rend le libellé du catalogue", () => {
    expect(libelleChamp("projet.montant")).not.toBe("projet.montant");
  });

  test("rend le chemin tel quel s'il est inconnu", () => {
    expect(libelleChamp("truc.machin")).toBe("truc.machin");
  });
});
