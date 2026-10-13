/**
 * Mode simulation : fiches fictives, stables pour un même code, pour présenter et
 * tester le rapatriement sans accès à T24. Les écrans signalent clairement qu'il
 * s'agit de données de démonstration ; ce mode n'a pas sa place en production.
 */

import type { FicheClientT24, FicheGroupeT24 } from "./normalisation";

function graine(code: string): number {
  let h = 2166136261;
  for (const c of code) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return Math.abs(h);
}

const SECTEURS = [
  "Énergies renouvelables",
  "Infrastructures de transport",
  "Eau et assainissement",
  "Industrie",
];
const VILLES = ["Casablanca", "Rabat", "Tanger", "Marrakech", "Agadir"];
const GROUPES = ["Atlas", "Sahara", "Rif", "Oasis", "Bouregreg"];

export function groupeDeDemonstration(code: string): FicheGroupeT24 {
  const g = graine(code);
  return {
    code,
    nom: `Groupe ${GROUPES[g % GROUPES.length]} (démonstration)`,
    paysSiege: "Maroc",
    secteurPrincipal: SECTEURS[g % SECTEURS.length],
    ratingGroupe: null,
  };
}

export function clientDeDemonstration(code: string): FicheClientT24 {
  const g = graine(code);
  const ville = VILLES[g % VILLES.length];
  const codeGroupe = `G${String((g % 900) + 100)}`;
  return {
    codeClientT24: code,
    champs: {
      nom: `Société démo ${code}`,
      raisonSociale: `SOCIETE DEMONSTRATION ${code.toUpperCase()} S.A.`,
      formeJuridique: "S.A.",
      ice: String(g).padStart(15, "0").slice(-15),
      registreCommerce: `RC ${String((g % 900000) + 100000)} ${ville}`,
      identifiantFiscal: String((g % 90000000) + 10000000),
      dateCreationSociete: `${2000 + (g % 20)}-0${(g % 9) + 1}-15`,
      pays: "Maroc",
      ville,
      adresse: `${(g % 200) + 1}, boulevard de démonstration`,
      secteur: SECTEURS[g % SECTEURS.length],
      dateRelation: `${2010 + (g % 12)}-01-10`,
      exposition: (g % 50) * 10_000_000,
      capitalSocial: ((g % 20) + 1) * 50_000_000,
      chiffreAffaires: ((g % 30) + 5) * 100_000_000,
    },
    groupe: { code: codeGroupe, nom: groupeDeDemonstration(codeGroupe).nom },
  };
}
