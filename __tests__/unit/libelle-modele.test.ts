import { nomModele, sansGeneration, NOM_MODELE } from "@/lib/libelle-modele";

describe("libellés du modèle sans génération", () => {
  it.each([
    ["PF V7++ - Project Finance Standard Model", "Project Finance Standard Model"],
    ["V4 - V7++ Complete (Excel)", "V4 - Complete (Excel)"],
    ["(ON = poids sectoriels ; OFF = socle V7++ seul)", "(ON = poids sectoriels ; OFF = socle seul)"],
    ["PF_V7PP", ""],
    ["Grille V7++.4+", "Grille"],
    ["V1 - Initial Release", "V1 - Initial Release"],
    ["v5", "v5"],
    ["V17 - révision", "V17 - révision"],
  ])("%s → %s", (avant, apres) => {
    expect(sansGeneration(avant)).toBe(apres);
  });

  it("nom générique quand le libellé ne contient que la génération", () => {
    expect(nomModele("PF_V7PP")).toBe(NOM_MODELE);
    expect(nomModele(null)).toBe(NOM_MODELE);
  });
});
