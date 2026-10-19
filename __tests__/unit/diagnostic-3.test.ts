import { deriverAlertesPF } from "@/lib/services/alert-derivation";
import { roleAttribuable } from "@/lib/entites/utilisateurs";
import { PARAMETRES_DEFAUT, parametresVisibles } from "@/lib/modele-pf/parametres";

const base = {
  projectId: "p1",
  projectName: "Projet",
  statut: "brouillon",
  updatedAt: "2026-10-01T00:00:00Z",
  libellesVerrous: PARAMETRES_DEFAUT.verrous,
  libellesPlafonds: PARAMETRES_DEFAUT.plafonds,
};

describe("alertes des scorings PF", () => {
  it("une exclusion et un blocage sont critiques, un plafond appelle la vigilance", () => {
    const a = deriverAlertesPF([{ ...base, id: "e1", verrousActifs: ["X3", "B8"], plafondsActifs: ["C2"] }]);
    expect(a.map((x) => [x.id, x.type, x.severite])).toEqual([
      ["e1:exclusion", "blocage", "critique"],
      ["e1:blocage", "blocage", "critique"],
      ["e1:plafond", "score_faible", "vigilance"],
    ]);
    expect(a[0].lienAction).toBe("/scoring-pf/e1");
    expect(a[2].message).toContain("note ≤ 5");
  });

  it("un scoring sans verrou ni plafond ne produit aucune alerte", () => {
    expect(deriverAlertesPF([{ ...base, id: "e2", verrousActifs: [], plafondsActifs: [] }])).toEqual([]);
  });
});

describe("attribution des rôles", () => {
  it("un administrateur du modèle n'attribue pas un rôle qui décide des dossiers", () => {
    expect(roleAttribuable("scoring_admin", "risk_manager", "risk_analyst")).toBe(false);
    expect(roleAttribuable("scoring_admin", "committee_member", "read_only")).toBe(false);
    expect(roleAttribuable("scoring_admin", "risk_analyst", "read_only")).toBe(true);
    // Un décideur existant se modifie sans changer de rôle (nom, entité).
    expect(roleAttribuable("scoring_admin", "risk_manager", "risk_manager")).toBe(true);
    expect(roleAttribuable("system_admin", "risk_manager", "risk_analyst")).toBe(true);
  });
});

describe("paramètres visibles", () => {
  it("sans visibilité des scores : ni conversion, ni grades, ni niveau des plafonds", () => {
    const P = parametresVisibles(PARAMETRES_DEFAUT, false);
    expect(P.conversion).toEqual([]);
    expect(P.correspondanceGrades).toEqual({});
    expect(Object.values(P.plafonds).every((p) => p.niveau === 0)).toBe(true);
    expect(P.poidsDomaines).toEqual(PARAMETRES_DEFAUT.poidsDomaines);
    expect(parametresVisibles(PARAMETRES_DEFAUT, true)).toBe(PARAMETRES_DEFAUT);
  });
});
