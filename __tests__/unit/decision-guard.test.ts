import {
  lireBlocages,
  motifsRefusDecisionFavorable,
  motifRefusDelegation,
  statutApresDecision,
} from "@/lib/services/scoring/decision-guard";

const traceSaine = JSON.stringify({ blockingRuleCodes: [], publicationBlocked: false });
const base = { status: "soumis", finalScore: 82, summaryJson: traceSaine, analystId: "analyste" };

describe("decision-guard", () => {
  it("accepte une décision favorable sur un dossier soumis, calculé, sans blocage, par un tiers", () => {
    expect(motifsRefusDecisionFavorable({ evaluation: base, decideurId: "manager" })).toEqual([]);
  });

  it("refuse si une règle NO_GO est déclenchée (T04)", () => {
    const ev = { ...base, summaryJson: JSON.stringify({ blockingRuleCodes: ["NOGO_DSCR"] }) };
    const motifs = motifsRefusDecisionFavorable({ evaluation: ev, decideurId: "manager" });
    expect(motifs.join(" ")).toContain("NOGO_DSCR");
  });

  it("refuse que l'analyste valide sa propre analyse (T04)", () => {
    expect(motifsRefusDecisionFavorable({ evaluation: base, decideurId: "analyste" })).toHaveLength(1);
  });

  it("refuse que l'auteur de la soumission décide", () => {
    expect(
      motifsRefusDecisionFavorable({ evaluation: base, decideurId: "x", soumisPar: "x" })
    ).toHaveLength(1);
  });

  it("refuse un dossier non calculé, non soumis ou à trace illisible", () => {
    const motifs = motifsRefusDecisionFavorable({
      evaluation: { ...base, status: "brouillon", finalScore: null, summaryJson: null },
      decideurId: "manager",
    });
    expect(motifs).toHaveLength(3);
  });

  it("refuse si la publication est bloquée", () => {
    const ev = { ...base, summaryJson: JSON.stringify({ blockingRuleCodes: [], publicationBlocked: true }) };
    expect(motifsRefusDecisionFavorable({ evaluation: ev, decideurId: "m" })).toHaveLength(1);
  });

  it("lit une trace sans blocage et signale une trace corrompue", () => {
    expect(lireBlocages(traceSaine).traceIlisible).toBe(false);
    expect(lireBlocages("{pas du json").traceIlisible).toBe(true);
  });

  it("une approbation supérieure demandée laisse le circuit en attente (T07)", () => {
    expect(statutApresDecision("APPROVE_WITH_CONDITIONS", true)).toBe("REVIEWED");
    expect(statutApresDecision("APPROVE", false)).toBe("APPROVED");
    expect(statutApresDecision("REJECT", false)).toBe("REJECTED");
    expect(() => statutApresDecision("PEUT_ETRE", false)).toThrow();
  });

  it("l'approbation supérieure exige une autre personne de rang supérieur", () => {
    const derniere = { decidedBy: "rm1", requiresHigherApproval: true, role: "risk_manager" };
    expect(motifRefusDelegation(derniere, "rm1", "system_admin")).not.toBeNull();
    expect(motifRefusDelegation(derniere, "rm2", "risk_manager")).not.toBeNull();
    expect(motifRefusDelegation(derniere, "admin", "scoring_admin")).toBeNull();
    expect(motifRefusDelegation(null, "x", "risk_manager")).toBeNull();
  });
});
