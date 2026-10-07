import {
  delegationSuffisante,
  lireBlocages,
  lireMatriceDelegation,
  roleRequisPourMontant,
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

  it("au rang le plus élevé, une autre personne de ce rang peut clore ; un refus suffit à rang égal", () => {
    const parAdmin = { decidedBy: "sa1", requiresHigherApproval: true, role: "system_admin" };
    expect(motifRefusDelegation(parAdmin, "sa2", "system_admin", "APPROVE")).toBeNull();
    const parManager = { decidedBy: "rm1", requiresHigherApproval: true, role: "risk_manager" };
    expect(motifRefusDelegation(parManager, "rm2", "risk_manager", "REJECT")).toBeNull();
    expect(motifRefusDelegation(parManager, "rm2", "risk_manager", "APPROVE")).not.toBeNull();
  });
});

describe("délégation par montant", () => {
  const matrice = lireMatriceDelegation(
    JSON.stringify([
      { montantMax: null, roleMinimum: "system_admin" },
      { montantMax: 100_000_000, roleMinimum: "risk_manager" },
      { montantMax: 500_000_000, roleMinimum: "scoring_admin" },
    ])
  );
  it("choisit le premier palier qui couvre le montant", () => {
    expect(roleRequisPourMontant(matrice, 50_000_000)).toBe("risk_manager");
    expect(roleRequisPourMontant(matrice, 300_000_000)).toBe("scoring_admin");
    expect(roleRequisPourMontant(matrice, 2_000_000_000)).toBe("system_admin");
  });
  it("sans matrice, aucune contrainte de montant n'est inventée", () => {
    expect(roleRequisPourMontant([], 1e12)).toBeNull();
    expect(lireMatriceDelegation("pas du json")).toEqual([]);
    expect(delegationSuffisante("risk_manager", null)).toBe(true);
  });
  it("un rôle inférieur au palier n'a pas la délégation", () => {
    expect(delegationSuffisante("risk_manager", "scoring_admin")).toBe(false);
    expect(delegationSuffisante("system_admin", "scoring_admin")).toBe(true);
  });
});
