import {
  deriverAnalyses,
  libelleMois,
  type EvaluationCalculee,
  type ResultatDomaine,
} from "@/lib/services/analytics-derivation";

const evaluation = (
  id: string,
  finalScore: number | null,
  rating: string | null,
  updatedAt = "2026-09-15T10:00:00.000Z",
  status = "validee"
): EvaluationCalculee => ({ id, status, finalScore, rating, updatedAt });

describe("deriverAnalyses — portefeuille sans évaluation calculée", () => {
  test("cinq brouillons ne produisent aucune analyse", () => {
    // L'état réel de la base au moment où l'écran affichait une distribution de notes
    // répartissant cinq dossiers entre AA, A, BBB et BB.
    const brouillons = Array.from({ length: 5 }, (_, i) =>
      evaluation(`ev${i}`, null, null, "2026-04-20T10:00:00.000Z", "brouillon")
    );
    const a = deriverAnalyses(brouillons, []);

    expect(a.sansDonnees).toBe(true);
    expect(a.scoreMoyen).toBeNull();
    expect(a.distributionNotes).toEqual([]);
    expect(a.moyennesParDomaine).toEqual([]);
    expect(a.tendance).toEqual([]);
    expect(a.effectif).toEqual({ total: 5, calculees: 0, brouillons: 5 });
  });

  test("un portefeuille vide ne produit rien non plus", () => {
    expect(deriverAnalyses([], []).sansDonnees).toBe(true);
  });
});

describe("deriverAnalyses — score et distribution", () => {
  const calculees = [
    evaluation("e1", 80, "BBB"),
    evaluation("e2", 60, "BB"),
    evaluation("e3", 40, "B"),
    evaluation("e4", 60, "BB"),
  ];

  test("le score moyen ne porte que sur les évaluations calculées", () => {
    const a = deriverAnalyses([...calculees, evaluation("e5", null, null)], []);
    expect(a.scoreMoyen).toBe(60);
    expect(a.effectif.calculees).toBe(4);
  });

  test("la distribution ne montre que les notes attribuées", () => {
    // Afficher toute l'échelle AAA…D avec des zéros laisserait croire à un
    // portefeuille qui la couvre.
    const a = deriverAnalyses(calculees, []);
    expect(a.distributionNotes.map((n) => n.note)).toEqual(["BB", "B", "BBB"]);
    expect(a.distributionNotes.find((n) => n.note === "BB")?.effectif).toBe(2);
  });

  test("les parts de la distribution totalisent 100 %", () => {
    const a = deriverAnalyses(calculees, []);
    const total = a.distributionNotes.reduce((s, n) => s + n.part, 0);
    expect(total).toBeCloseTo(100, 6);
  });

  test("une évaluation calculée sans note ne fausse pas les parts", () => {
    const a = deriverAnalyses([...calculees, evaluation("e6", 55, null)], []);
    expect(a.distributionNotes.reduce((s, n) => s + n.part, 0)).toBeCloseTo(100, 6);
    expect(a.scoreMoyen).toBeCloseTo((80 + 60 + 40 + 60 + 55) / 5, 6);
  });
});

describe("deriverAnalyses — moyennes par domaine", () => {
  const resultats: ResultatDomaine[] = [
    { evaluationId: "e1", domainCode: "D1", domainLabel: "Sponsor", rawScore: 80, weight: 10 },
    { evaluationId: "e2", domainCode: "D1", domainLabel: "Sponsor", rawScore: 60, weight: 10 },
    { evaluationId: "e1", domainCode: "D7", domainLabel: "Financier", rawScore: 50, weight: 15 },
  ];

  test("moyenne les résultats de chaque domaine", () => {
    const a = deriverAnalyses(
      [evaluation("e1", 70, "BB"), evaluation("e2", 60, "BB")],
      resultats
    );
    const d1 = a.moyennesParDomaine.find((d) => d.code === "D1");
    expect(d1?.scoreMoyen).toBe(70);
    expect(d1?.effectif).toBe(2);
  });

  test("ignore les résultats d'évaluations non calculées", () => {
    // Sinon un domaine noté dans un brouillon abaisserait la moyenne du portefeuille.
    const a = deriverAnalyses([evaluation("e1", 70, "BB")], resultats);
    expect(a.moyennesParDomaine.find((d) => d.code === "D1")?.effectif).toBe(1);
    expect(a.moyennesParDomaine.find((d) => d.code === "D1")?.scoreMoyen).toBe(80);
  });

  test("les domaines sont présentés dans l'ordre de leur code", () => {
    const a = deriverAnalyses(
      [evaluation("e1", 70, "BB"), evaluation("e2", 60, "BB")],
      resultats
    );
    expect(a.moyennesParDomaine.map((d) => d.code)).toEqual(["D1", "D7"]);
  });
});

describe("deriverAnalyses — tendance", () => {
  test("regroupe par mois et classe chronologiquement", () => {
    const a = deriverAnalyses(
      [
        evaluation("e1", 70, "BB", "2026-08-10T00:00:00.000Z"),
        evaluation("e2", 50, "B", "2026-08-25T00:00:00.000Z"),
        evaluation("e3", 90, "A", "2026-07-02T00:00:00.000Z"),
      ],
      []
    );
    expect(a.tendance.map((p) => p.mois)).toEqual(["2026-07", "2026-08"]);
    expect(a.tendance[1].scoreMoyen).toBe(60);
    expect(a.tendance[1].effectif).toBe(2);
  });
});

describe("libelleMois", () => {
  test("met le mois en français", () => {
    expect(libelleMois("2026-09")).toBe("sept. 2026");
    expect(libelleMois("2026-01")).toBe("janv. 2026");
  });

  test("restitue la clé telle quelle si elle est inattendue", () => {
    expect(libelleMois("2026-13")).toBe("2026-13");
  });
});
