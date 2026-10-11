import {
  ascendance,
  calculerPerimetre,
  cheminDe,
  descendance,
  habillageHerite,
  peutEcrire,
  peutLire,
  type EntiteResume,
} from "@/lib/entites/perimetre";
import { argumentsFiltres, reference, restreindre } from "@/lib/entites/filtre-prisma";
import { compteGerable, entiteAttribuable, roleAttribuable } from "@/lib/entites/utilisateurs";

/**
 * Groupe type « banque populaire » :
 *   BCP (groupe)
 *   ├── BP-CASA (banque régionale)
 *   ├── BP-RABAT (banque régionale)
 *   └── AFRIQUE (groupe de filiales)
 *       ├── BANK-SN (filiale)
 *       └── BANK-CI (filiale)
 */
function entite(id: string, parent: EntiteResume | null, extra: Partial<EntiteResume> = {}): EntiteResume {
  return {
    id, code: id.toUpperCase(), nom: id, type: "BANQUE", parentId: parent?.id ?? null,
    chemin: cheminDe(id, parent?.chemin ?? null), niveau: parent ? parent.niveau + 1 : 0,
    pays: null, isActive: true, nomOutil: null, logoUrl: null, couleurPrimaire: null, ...extra,
  };
}
const bcp = entite("bcp", null, { nomOutil: "Scoring BCP", logoUrl: "/logo-bcp.png", couleurPrimaire: "#123456" });
const casa = entite("casa", bcp);
const rabat = entite("rabat", bcp);
const afrique = entite("afrique", bcp, { logoUrl: "/logo-afrique.png" });
const sn = entite("sn", afrique, { nomOutil: "Scoring Sénégal" });
const ci = entite("ci", afrique);
const arbre = [bcp, casa, rabat, afrique, sn, ci];

describe("périmètre multi-banques", () => {
  it("descendance et ascendance", () => {
    expect(descendance(arbre, "afrique").sort()).toEqual(["afrique", "ci", "sn"]);
    expect(descendance(arbre, "bcp")).toHaveLength(6);
    expect(ascendance(arbre, "sn").map((e) => e.id)).toEqual(["sn", "afrique", "bcp"]);
  });

  it("la maison mère voit toutes ses filiales ; une filiale ne voit ni sa mère ni ses sœurs", () => {
    const groupe = calculerPerimetre(arbre, { entiteId: "bcp" });
    expect(peutLire(groupe, "sn")).toBe(true);
    const regionale = calculerPerimetre(arbre, { entiteId: "casa" });
    expect(regionale.lecture).toEqual(["casa"]);
    expect(peutLire(regionale, "bcp")).toBe(false);
    expect(peutLire(regionale, "rabat")).toBe(false);
    const sousGroupe = calculerPerimetre(arbre, { entiteId: "afrique" });
    expect(sousGroupe.lecture.sort()).toEqual(["afrique", "ci", "sn"]);
    expect(peutLire(sousGroupe, "casa")).toBe(false);
  });

  it("écriture : sa banque seulement, ou toute sa branche avec la portée « groupe »", () => {
    const consultation = calculerPerimetre(arbre, { entiteId: "bcp", porteeEcriture: "entite" });
    expect(peutEcrire(consultation, "bcp")).toBe(true);
    expect(peutEcrire(consultation, "casa")).toBe(false);
    const grandsComptes = calculerPerimetre(arbre, { entiteId: "bcp", porteeEcriture: "groupe" });
    expect(peutEcrire(grandsComptes, "casa")).toBe(true);
    expect(peutEcrire(grandsComptes, "sn")).toBe(true);
  });

  it("compte sans entité : tout ; entité inconnue ou désactivée (ou ascendante désactivée) : rien", () => {
    expect(calculerPerimetre(arbre, { entiteId: null }).tout).toBe(true);
    expect(calculerPerimetre(arbre, { entiteId: "inconnue" }).lecture).toEqual([]);
    const ferme = arbre.map((e) => (e.id === "afrique" ? { ...e, isActive: false } : e));
    expect(calculerPerimetre(ferme, { entiteId: "sn" }).lecture).toEqual([]);
    expect(calculerPerimetre(ferme, { entiteId: "bcp" }).lecture).toContain("sn");
  });

  it("habillage hérité de la maison mère, surchargé par la filiale", () => {
    expect(habillageHerite(arbre, "sn")).toEqual({ nomOutil: "Scoring Sénégal", logoUrl: "/logo-afrique.png", couleurPrimaire: "#123456", entite: "sn" });
    expect(habillageHerite(arbre, "casa").nomOutil).toBe("Scoring BCP");
    expect(habillageHerite(arbre, null).nomOutil).toBeNull();
  });
});

describe("filtre des requêtes", () => {
  const p = calculerPerimetre(arbre, { entiteId: "afrique" });

  it("lecture filtrée sur la branche, écriture sur l'entité", () => {
    expect(argumentsFiltres("Client", "findMany", { where: { nom: "x" } }, p)).toEqual({
      where: { nom: "x", AND: [{ entiteId: { in: p.lecture } }] },
    });
    expect(argumentsFiltres("ScoringEvaluation", "update", { where: { id: "e1" }, data: {} }, p)).toEqual({
      where: { id: "e1", AND: [{ project: { entiteId: { in: ["afrique"] } } }] },
      data: {},
    });
    expect(argumentsFiltres("ScoringDocument", "count", undefined, p)).toEqual({
      where: { AND: [{ evaluation: { project: { entiteId: { in: p.lecture } } } }] },
    });
  });

  it("modèles non cloisonnés et périmètre total : arguments inchangés", () => {
    const args = { where: { id: "x" } };
    expect(argumentsFiltres("ScoringNode", "findMany", args, p)).toBe(args);
    expect(argumentsFiltres("Client", "findMany", args, calculerPerimetre(arbre, { entiteId: null }))).toBe(args);
  });

  it("conserve un AND existant et lit les références connect", () => {
    expect(restreindre({ AND: { a: 1 } }, { b: 2 })).toEqual({ AND: [{ a: 1 }, { b: 2 }] });
    expect(reference({ project: { connect: { id: "p1" } } }, "projectId", "project")).toBe("p1");
    expect(reference({ projectId: "p2" }, "projectId", "project")).toBe("p2");
  });
});

describe("gestion des comptes dans le périmètre", () => {
  const adminAfrique = calculerPerimetre(arbre, { entiteId: "afrique" });
  const adminGlobal = calculerPerimetre(arbre, { entiteId: null });

  it("un administrateur de filiale gère sa branche seulement", () => {
    expect(compteGerable(adminAfrique, "sn")).toBe(true);
    expect(compteGerable(adminAfrique, "casa")).toBe(false);
    expect(compteGerable(adminAfrique, null)).toBe(false);
    expect(compteGerable(adminGlobal, null)).toBe(true);
  });

  it("rattachement : par défaut l'entité de l'administrateur, jamais hors branche", () => {
    expect(entiteAttribuable(adminAfrique, undefined)).toEqual({ ok: true, entiteId: "afrique" });
    expect(entiteAttribuable(adminAfrique, "ci")).toEqual({ ok: true, entiteId: "ci" });
    expect(entiteAttribuable(adminAfrique, "bcp").ok).toBe(false);
    expect(entiteAttribuable(adminAfrique, null).ok).toBe(false);
    expect(entiteAttribuable(adminGlobal, null)).toEqual({ ok: true, entiteId: null });
  });

  it("seul un administrateur système touche au rôle d'administrateur système", () => {
    expect(roleAttribuable("scoring_admin", "system_admin")).toBe(false);
    expect(roleAttribuable("scoring_admin", "risk_analyst", "system_admin")).toBe(false);
    expect(roleAttribuable("scoring_admin", "risk_analyst", "read_only")).toBe(true);
    expect(roleAttribuable("system_admin", "system_admin")).toBe(true);
  });
});
