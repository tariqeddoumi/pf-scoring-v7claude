/**
 * Effet du lot 2 du volet climatique sur les dix-huit cas d'étude (fiches climat fictives) :
 * note, plafonds, N2 et D9 avec le lot 2 inactif (calcul actuel, identique à l'Excel) puis
 * actif. Sortie JSON, reprise dans le dossier de validation du comité.
 *
 *   npx tsx scripts/docs/impact-climat-lot2.ts > impact.json
 */
import cas from "../../lib/modele-pf/cas-etude.json";
import { saisieDepuisCasExcel } from "../../lib/modele-pf/conversion";
import { calculer, relireSaisie } from "../../lib/modele-pf/saisie";
import { PARAMETRES_DEFAUT, type ParametresModele } from "../../lib/modele-pf/parametres";
import { FICHES_CLIMAT_CAS } from "../../lib/modele-pf/cas-climat";

export function impactLot2() {
  const actif: ParametresModele = { ...PARAMETRES_DEFAUT, climat: { ...PARAMETRES_DEFAUT.climat, lot2Actif: true } };
  return cas.map((c) => {
    const s = saisieDepuisCasExcel(c.dossier);
    const f = FICHES_CLIMAT_CAS[c.dossier.onglet];
    if (f) s.climat = relireSaisie({ ...s, climat: { ...s.climat, ...f } }).climat;
    const avant = calculer(s).resultat;
    const apres = calculer(s, actif).resultat;
    return {
      cas: c.dossier.onglet, titre: c.dossier.titre, secteur: c.dossier.secteur,
      noteAvant: avant.noteApprouvee, noteApres: apres.noteApprouvee,
      scoreAvant: avant.score, scoreApres: apres.score,
      d9Avant: avant.domaines.D9, d9Apres: apres.domaines.D9,
      n2Avant: avant.noyau[1], n2Apres: apres.noyau[1],
      plafondsAjoutes: apres.plafondsActifs.filter((p) => !avant.plafondsActifs.includes(p)),
      plafondsRetires: avant.plafondsActifs.filter((p) => !apres.plafondsActifs.includes(p)),
      exposition: { bloc2: s.climatEleve, retenue: apres.climat?.expositionRetenue ?? null },
      transition: apres.climat?.niveauTransition ?? null,
      stressRetenu: apres.climat?.stressRetenu ?? null,
      dscrStresseAvant: avant.dscrMinStresse, dscrStresseApres: apres.dscrMinStresse,
      statutApres: apres.statut,
    };
  });
}

if (require.main === module) console.log(JSON.stringify(impactLot2(), null, 2));
