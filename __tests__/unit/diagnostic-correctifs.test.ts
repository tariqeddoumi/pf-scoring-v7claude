/**
 * Correctifs du diagnostic d'octobre 2026 : mises à jour partielles, relecture d'une
 * saisie ancienne, séparation des fonctions sur la validation d'un scoring PF.
 */
import { seulementFournis, updateUserSchema, updateClientSchema } from "@/lib/validation-schemas";
import { creditSchema } from "@/lib/modele-pf/credits";
import { relireSaisie, saisieVide } from "@/lib/modele-pf/saisie";
import { peutDecider } from "@/lib/modele-pf/serveur";

jest.mock("@/lib/services/app-config-service", () => ({ getAppConfigKey: jest.fn(), setAppConfig: jest.fn() }));

describe("mises à jour partielles", () => {
  it("ne remet pas les valeurs par défaut des champs non envoyés", () => {
    const corps = { nom: "Nouveau nom" };
    expect(seulementFournis(updateUserSchema.parse(corps), corps)).toEqual({ nom: "Nouveau nom" });
    expect(seulementFournis(updateClientSchema.parse(corps), corps)).not.toHaveProperty("type");
    const credit = { montant: 12 };
    expect(seulementFournis(creditSchema.partial().parse(credit), credit)).toEqual({ montant: 12 });
  });
});

describe("relecture d'une saisie stockée", () => {
  it("garde les blocs valides quand un bloc ne passe plus le schéma", () => {
    const s = { ...saisieVide(), regime: "R1", secteur: "ENR", choc: 5 /* invalide : > 0,95 */ };
    const lue = relireSaisie(s);
    expect(lue.regime).toBe("R1");
    expect(lue.secteur).toBe("ENR");
    expect(lue.choc).toBeNull();
  });
  it("relit une saisie illisible comme une saisie vide", () => {
    expect(relireSaisie(null)).toEqual(saisieVide());
  });
});

describe("séparation des fonctions", () => {
  it("refuse la décision à l'auteur, au dernier modificateur et au créateur du projet", () => {
    for (const intervenant of ["auteur", "soumetteur", "createur"]) {
      expect(peutDecider("risk_manager", intervenant, ["auteur", "soumetteur", "createur"])).toBe(false);
    }
    expect(peutDecider("risk_manager", "tiers", ["auteur", "soumetteur", "createur"])).toBe(true);
    expect(peutDecider("risk_analyst", "tiers", ["auteur"])).toBe(false);
  });
});
