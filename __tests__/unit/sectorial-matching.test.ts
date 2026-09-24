import { choisirSecteur } from "@/lib/services/scoring/sectorial";

/** Candidats tels que les renvoie la requête, triés par orderIndex puis code. */
const candidats = [
  { code: "ENR", label: "Énergies renouvelables" },
  { code: "EAU", label: "Eau et assainissement" },
  { code: "EAU_DESSAL", label: "Eau — dessalement" },
];

describe("choisirSecteur", () => {
  test("le code exact l'emporte sur toute correspondance de libellé", () => {
    expect(choisirSecteur(candidats, "EAU")?.code).toBe("EAU");
    expect(choisirSecteur(candidats, "eau")?.code).toBe("EAU");
  });

  test("le libellé exact l'emporte sur une correspondance partielle", () => {
    const partiels = [
      { code: "EAU_DESSAL", label: "Eau — dessalement" },
      { code: "EAU", label: "Eau et assainissement" },
    ];
    expect(choisirSecteur(partiels, "Eau et assainissement")?.code).toBe("EAU");
  });

  test("à défaut, le premier candidat du tri stable est retenu", () => {
    // Deux libellés contiennent « Eau » : le résultat doit être reproductible,
    // là où findFirst sans tri pouvait changer d'une requête à l'autre.
    const partiels = [
      { code: "EAU", label: "Eau et assainissement" },
      { code: "EAU_DESSAL", label: "Eau — dessalement" },
    ];
    expect(choisirSecteur(partiels, "Eau")?.code).toBe("EAU");
    expect(choisirSecteur([...partiels], "Eau")?.code).toBe("EAU");
  });

  test("la casse et les espaces autour du terme sont sans effet", () => {
    expect(choisirSecteur(candidats, "  enr  ")?.code).toBe("ENR");
  });

  test("aucun candidat ne donne aucun secteur", () => {
    expect(choisirSecteur([], "ENR")).toBeNull();
  });
});
