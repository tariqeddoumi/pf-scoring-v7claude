/**
 * Exporte, pour le générateur des pièces des 18 cas d'étude (docs/cas-etude-pieces/generer.py),
 * les données de chaque cas, la fiche client/projet et le résultat calculé par le moteur :
 * les pièces décrivent ainsi exactement le dossier saisi dans l'outil.
 *
 *   npx tsx scripts/docs/exporter-donnees-cas.ts > docs/cas-etude-pieces/donnees.json
 */
import cas from "../../lib/modele-pf/cas-etude.json";
import { REFERENTIEL } from "../../lib/modele-pf/referentiel-donnees";
import { PARAMETRES_DEFAUT } from "../../lib/modele-pf/parametres";
import { saisieDepuisCasExcel } from "../../lib/modele-pf/conversion";
import { calculerEvaluation } from "../../lib/modele-pf/serveur";
import { FICHES_CAS } from "../db/fiches-cas-pf-donnees";

type Dossier = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const sortie = (cas as { dossier: Dossier }[]).map(({ dossier: d }) => {
  const saisie = saisieDepuisCasExcel(d);
  const { resultat } = calculerEvaluation(saisie, PARAMETRES_DEFAUT, { codeClientT24: d.code_client, radical: d.radical, codeProjet: d.code_projet });
  return { dossier: d, fiche: FICHES_CAS[d.code_projet], saisie, resultat };
});

console.log(
  JSON.stringify(
    {
      cas: sortie,
      referentiel: REFERENTIEL,
      parametres: {
        regimes: PARAMETRES_DEFAUT.regimes,
        secteurs: PARAMETRES_DEFAUT.secteurs,
        phases: PARAMETRES_DEFAUT.phases,
        sousCriteres: PARAMETRES_DEFAUT.sousCriteres,
        libellesDomaines: PARAMETRES_DEFAUT.libellesDomaines,
        verrous: PARAMETRES_DEFAUT.verrous,
        plafonds: PARAMETRES_DEFAUT.plafonds,
      },
    },
    null,
    1
  )
);
