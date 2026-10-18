/** Accès au référentiel des niveaux (données générées : referentiel-donnees.ts). */
import { REFERENTIEL } from "./referentiel-donnees";

export const NIVEAUX_LIBELLES = [...REFERENTIEL.niveauxLib, REFERENTIEL.info] as const;

type Niveaux = Record<string, { libelle: string; descriptions: readonly string[] }>;
const NIVEAUX = REFERENTIEL.niveaux as unknown as Niveaux;
const VARIANTES = REFERENTIEL.variantesSectorielles as unknown as Record<string, readonly string[]>;
const CHAMPS = REFERENTIEL.champsSecteur as unknown as Record<string, readonly { libelle: string; unite: string }[]>;

/** Les quatre descriptions d'un sous-critère (ou de N4 à N6), variante du secteur si elle existe. */
export function descriptions(cle: string, secteur: string | null): readonly string[] {
  return (secteur && VARIANTES[`${cle}|${secteur}`]) || NIVEAUX[cle]?.descriptions || [];
}

/** Les cinq choix tels que l'Excel les présente : « Niveau — description », puis « Info. insuffisante ». */
export function options(cle: string, secteur: string | null): string[] {
  const d = descriptions(cle, secteur);
  return [...REFERENTIEL.niveauxLib.map((n, i) => `${n}${REFERENTIEL.separateur}${d[i] ?? ""}`), REFERENTIEL.info];
}

export function estSectoriel(cle: string): boolean {
  return (REFERENTIEL.sousCriteresSectoriels as readonly string[]).includes(cle);
}

export function libelleCritere(cle: string): string {
  return NIVEAUX[cle]?.libelle ?? cle;
}

/** Données du bloc 4 propres au secteur (3 à 6 champs). */
export function champsSecteur(secteur: string | null): readonly { libelle: string; unite: string }[] {
  return (secteur && CHAMPS[secteur]) || [];
}
