import { genererMotDePasseProvisoire, LONGUEUR_PROVISOIRE, motifsRefusMotDePasse } from "@/lib/mot-de-passe";

describe("mots de passe", () => {
  it("le mot de passe provisoire respecte les règles et varie d'un tirage à l'autre", () => {
    const tirages = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const m = genererMotDePasseProvisoire();
      expect(m).toHaveLength(LONGUEUR_PROVISOIRE);
      expect(motifsRefusMotDePasse(m)).toEqual([]);
      expect(m).not.toMatch(/[0O1lI]/);
      tirages.add(m);
    }
    expect(tirages.size).toBe(200);
  });

  it("refuse un mot de passe trop court ou trop simple", () => {
    expect(motifsRefusMotDePasse("abc")).toEqual(
      expect.arrayContaining(["au moins 12 caractères", "une majuscule", "un chiffre", "un caractère spécial"])
    );
    expect(motifsRefusMotDePasse("Robuste-2026!x")).toEqual([]);
  });

  it("refuse l'identifiant du compte et la réutilisation du mot de passe actuel", () => {
    expect(motifsRefusMotDePasse("GesRisk1-Maroc!", { email: "GesRisk1@banque.ma" })).toContain(
      "ne pas contenir l'identifiant du compte"
    );
    expect(motifsRefusMotDePasse("Robuste-2026!x", { ancien: "Robuste-2026!x" })).toContain(
      "être différent du mot de passe actuel"
    );
  });
});
