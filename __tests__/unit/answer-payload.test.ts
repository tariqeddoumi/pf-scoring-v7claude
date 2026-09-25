import { normalizeAnswers } from "@/lib/services/scoring/answer-payload";

const TYPES = new Map<string, string>([
  ["n-option", "OPTION_SINGLE"],
  ["n-num", "NUMERIC"],
  ["n-bool", "BOOLEAN"],
  ["n-date", "DATE"],
  ["n-text", "TEXT"],
]);

describe("normalizeAnswers — le contrat qui avait fait perdre 100 % de la saisie", () => {
  it("accepte le format réellement émis par l'atelier de saisie", () => {
    const { writes, ignored } = normalizeAnswers(
      [
        { nodeId: "n-option", valueString: "FORT", comment: "sponsor solide" },
        { nodeId: "n-num", valueNumber: 1.45 },
        { nodeId: "n-bool", valueBoolean: true },
      ],
      TYPES
    );

    expect(ignored).toEqual([]);
    expect(writes).toHaveLength(3);
    expect(writes[0]).toMatchObject({
      nodeId: "n-option",
      answerType: "OPTION_SINGLE",
      valueString: "FORT",
      comment: "sponsor solide",
    });
    expect(writes[1].valueNumber).toBe(1.45);
    expect(writes[2].valueBoolean).toBe(true);
  });

  it("prend le type de réponse sur le nœud et ne le devine jamais", () => {
    const { writes } = normalizeAnswers([{ nodeId: "n-text", valueString: "libre" }], TYPES);
    expect(writes[0].answerType).toBe("TEXT");
  });

  it("reste compatible avec l'ancienne forme à valeur unique", () => {
    const { writes, ignored } = normalizeAnswers(
      [
        { nodeId: "n-option", value: "MOYEN" },
        { nodeId: "n-num", value: 42 },
        { nodeId: "n-bool", value: false },
      ],
      TYPES
    );
    expect(ignored).toEqual([]);
    expect(writes[0].valueString).toBe("MOYEN");
    expect(writes[1].valueNumber).toBe(42);
    expect(writes[2].valueBoolean).toBe(false);
  });

  it("route une chaîne de date ISO vers la colonne date", () => {
    const { writes } = normalizeAnswers([{ nodeId: "n-date", value: "2026-01-15" }], TYPES);
    expect(writes[0].valueDate).toBeInstanceOf(Date);
    expect(writes[0].valueString).toBeNull();
  });

  it("accepte une valeur booléenne false, qui n'est pas une absence de réponse", () => {
    const { writes, ignored } = normalizeAnswers(
      [{ nodeId: "n-bool", valueBoolean: false }],
      TYPES
    );
    expect(ignored).toEqual([]);
    expect(writes[0].valueBoolean).toBe(false);
  });

  it("accepte une valeur numérique zéro", () => {
    const { writes } = normalizeAnswers([{ nodeId: "n-num", valueNumber: 0 }], TYPES);
    expect(writes).toHaveLength(1);
    expect(writes[0].valueNumber).toBe(0);
  });

  it("accepte une mise à jour de commentaire seule", () => {
    const { writes, ignored } = normalizeAnswers(
      [{ nodeId: "n-option", comment: "à revoir en comité" }],
      TYPES
    );
    expect(ignored).toEqual([]);
    expect(writes[0].touched.comment).toBe(true);
    expect(writes[0].comment).toBe("à revoir en comité");
  });

  it("ne marque pas le commentaire comme touché lorsqu'il est absent", () => {
    const { writes } = normalizeAnswers([{ nodeId: "n-option", valueString: "FORT" }], TYPES);
    expect(writes[0].touched.comment).toBe(false);
  });

  it("porte le motif de dérogation", () => {
    const { writes } = normalizeAnswers(
      [{ nodeId: "n-num", valueNumber: 9, overrideReason: "avis ingénieur indépendant" }],
      TYPES
    );
    expect(writes[0].isOverridden).toBe(true);
    expect(writes[0].overrideReason).toBe("avis ingénieur indépendant");
  });
});

describe("normalizeAnswers — rien n'est écarté en silence", () => {
  it("signale une entrée sans nodeId", () => {
    const { writes, ignored } = normalizeAnswers([{ valueString: "X" }], TYPES);
    expect(writes).toEqual([]);
    expect(ignored).toEqual([{ reason: "nodeId manquant" }]);
  });

  it("signale un nœud absent du référentiel", () => {
    const { writes, ignored } = normalizeAnswers(
      [{ nodeId: "n-inconnu", valueString: "X" }],
      TYPES
    );
    expect(writes).toEqual([]);
    expect(ignored[0]).toEqual({
      nodeId: "n-inconnu",
      reason: "nœud inconnu dans le référentiel",
    });
  });

  it("signale une entrée sans aucune valeur ni commentaire", () => {
    const { writes, ignored } = normalizeAnswers([{ nodeId: "n-option" }], TYPES);
    expect(writes).toEqual([]);
    expect(ignored[0].reason).toBe("aucune valeur ni commentaire fourni");
  });

  it("enregistre les entrées valides et n'écarte que les fautives", () => {
    const { writes, ignored } = normalizeAnswers(
      [
        { nodeId: "n-option", valueString: "FORT" },
        { nodeId: "n-inconnu", valueString: "X" },
        { nodeId: "n-num", valueNumber: 3 },
      ],
      TYPES
    );
    expect(writes).toHaveLength(2);
    expect(ignored).toHaveLength(1);
  });

  it("tolère un corps qui n'est pas un tableau", () => {
    expect(normalizeAnswers(null, TYPES)).toEqual({ writes: [], ignored: [] });
    expect(normalizeAnswers(undefined, TYPES)).toEqual({ writes: [], ignored: [] });
  });

  it("ignore une date invalide sans faire échouer la réponse", () => {
    const { writes } = normalizeAnswers(
      [{ nodeId: "n-date", valueDate: "pas-une-date" }],
      TYPES
    );
    expect(writes[0].valueDate).toBeNull();
  });
});
