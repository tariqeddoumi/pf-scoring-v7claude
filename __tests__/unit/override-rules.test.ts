import { exigeRecalcul, motifRefusTransitionDerogation } from "@/lib/services/scoring/override-rules";

describe("override-rules", () => {
  it("un tiers approuve une proposition en attente", () => {
    expect(motifRefusTransitionDerogation({ statutActuel: "PENDING", cible: "APPROVED", proposePar: "a", utilisateur: "b" })).toBeNull();
  });
  it("l'auteur ne s'approuve pas", () => {
    expect(motifRefusTransitionDerogation({ statutActuel: "PENDING", cible: "APPROVED", proposePar: "a", utilisateur: "a" })).not.toBeNull();
  });
  it("transitions interdites", () => {
    expect(motifRefusTransitionDerogation({ statutActuel: "REJECTED", cible: "APPROVED", proposePar: "a", utilisateur: "b" })).not.toBeNull();
    expect(motifRefusTransitionDerogation({ statutActuel: "PENDING", cible: "REVERTED", proposePar: "a", utilisateur: "b" })).not.toBeNull();
  });
  it("approbation et annulation imposent un recalcul", () => {
    expect(exigeRecalcul("APPROVED")).toBe(true);
    expect(exigeRecalcul("REVERTED")).toBe(true);
    expect(exigeRecalcul("REJECTED")).toBe(false);
  });
});
