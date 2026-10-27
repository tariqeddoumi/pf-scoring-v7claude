/**
 * Exporte les fiches climat fictives des 18 cas (lib/modele-pf/cas-climat.ts) et les
 * référentiels du volet climatique (aléas par secteur, scénarios de référence, repères)
 * pour le générateur de l'outil Excel : une seule source pour le web et l'Excel.
 *
 *   npx tsx scripts/docs/exporter-climat-excel.ts
 */
import { writeFileSync } from "fs";
import { join } from "path";
import { FICHES_CLIMAT_CAS } from "../../lib/modele-pf/cas-climat";
import { ALEAS, ALEAS_PAR_SECTEUR, EFFETS_ALEAS, LIBELLES_ALEAS, SCENARIOS_CLIMAT, SEUILS_CLIMAT } from "../../lib/modele-pf/climat";
import { PARAMETRES_DEFAUT } from "../../lib/modele-pf/parametres";

const sortie = join(__dirname, "../../docs/outil-excel/generateur/cas_climat.json");
const donnees = {
  aleas: ALEAS.map((a) => ({ code: a, libelle: LIBELLES_ALEAS[a], effets: EFFETS_ALEAS[a] })),
  aleasParSecteur: ALEAS_PAR_SECTEUR,
  scenarios: SCENARIOS_CLIMAT,
  seuils: SEUILS_CLIMAT,
  lot2: PARAMETRES_DEFAUT.climat,
  plafonds: { C16: PARAMETRES_DEFAUT.plafonds.C16, C17: PARAMETRES_DEFAUT.plafonds.C17 },
  fiches: FICHES_CLIMAT_CAS,
};
writeFileSync(sortie, JSON.stringify(donnees, null, 2) + "\n");
console.log(`Écrit : ${sortie}`);
