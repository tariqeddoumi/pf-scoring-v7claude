/**
 * Noms affichés du modèle de notation.
 *
 * Les libellés enregistrés en base portent encore la génération technique du modèle
 * (« PF V7++ - Project Finance Standard Model », « V4 - V7++ Complete (Excel) »,
 * code « PF_V7PP ») : elle ne doit plus apparaître à l'écran. Seul ce marqueur est
 * retiré : les numéros de version (« V4 ») restent, ils servent dans les tables de
 * paramétrage.
 */

const MARQUEUR = /(?:\bPF[_ ])?(?<![A-Za-z0-9])V7(?:\+\+|\+|PP\b)?(?:\.\d+\+?)?/gi;

export const NOM_MODELE = "Modèle de notation Project Finance";

/** Retire le marqueur « V7++ » d'un libellé et nettoie les séparateurs restés orphelins. */
export function sansGeneration(texte: string | null | undefined): string {
  if (!texte) return "";
  return texte
    .replace(MARQUEUR, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+([,)])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s\-–—:·]+|[\s\-–—:·]+$/g, "")
    .replace(/\s+[-–—]\s+(?=[-–—]|$)/g, "")
    .trim();
}

/** Nom du modèle à afficher : son libellé sans génération, ou le nom générique. */
export function nomModele(libelle: string | null | undefined): string {
  return sansGeneration(libelle) || NOM_MODELE;
}
