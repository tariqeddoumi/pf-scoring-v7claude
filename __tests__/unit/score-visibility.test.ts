import { masquerScores, peutVoirScores } from "@/lib/score-visibility";

describe("visibilité des scores", () => {
  it("administrateurs et décideurs voient les scores, les autres non", () => {
    for (const r of ["system_admin", "scoring_admin", "risk_manager", "committee_member"]) expect(peutVoirScores(r)).toBe(true);
    for (const r of ["risk_analyst", "auditor", "read_only", undefined, ""]) expect(peutVoirScores(r)).toBe(false);
  });

  it("retire les scores à toute profondeur et garde les données saisies", () => {
    const reponse = {
      success: true,
      data: {
        id: "e1",
        finalScore: 82.4,
        rating: "A",
        recommendation: "Grade A — favorable",
        summaryJson: "{...}",
        incomplet: true,
        donneesObligatoiresManquantes: ["FIN.DSCR"],
        project: { nom: "Centrale", scoreGlobal: 82, grade: "A", montant: 450 },
        domains: [{ code: "D1", label: "Sponsors", score: 90, weight: 0.1 }],
        questionnaire: [{ code: "C1", options: [{ value: "X", label: "Oui", score: 10 }], scoreMin: 0, scoreMax: 10 }],
        dscr: 1.35,
      },
    };
    const m = masquerScores(reponse);
    expect(JSON.stringify(m)).not.toMatch(/finalScore|"rating"|recommendation|summaryJson|scoreGlobal|"grade"|"score"/);
    expect(m.data.project).toEqual({ nom: "Centrale", montant: 450 });
    expect(m.data.domains[0]).toEqual({ code: "D1", label: "Sponsors", weight: 0.1 });
    expect(m.data.questionnaire[0].options[0]).toEqual({ value: "X", label: "Oui" });
    expect(m.data.incomplet).toBe(true);
    expect(m.data.donneesObligatoiresManquantes).toEqual(["FIN.DSCR"]);
    expect(m.data.dscr).toBe(1.35);
  });
});
