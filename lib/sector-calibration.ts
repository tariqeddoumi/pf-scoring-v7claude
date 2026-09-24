/**
 * Bornes des facteurs de calibrage sectoriel.
 *
 * Un facteur multiplie le poids d'un domaine pour un secteur donné. En dehors de cet
 * intervalle, le calibrage cesse d'ajuster le modèle pour le réécrire : un facteur de
 * 5 sur un domaine rendrait les huit autres négligeables.
 *
 * Module volontairement dépourvu de dépendance serveur : l'écran d'administration et
 * la route qui valide l'enregistrement doivent appliquer exactement les mêmes bornes.
 */

export const FACTEUR_MIN = 0.5;
export const FACTEUR_MAX = 2;

export function facteurValide(facteur: number): boolean {
  return (
    Number.isFinite(facteur) && facteur >= FACTEUR_MIN && facteur <= FACTEUR_MAX
  );
}
