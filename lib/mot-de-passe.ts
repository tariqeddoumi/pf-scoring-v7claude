import { randomInt } from "crypto";

/**
 * Mots de passe des comptes.
 *
 * L'écran d'administration créait les comptes SANS mot de passe : ils ne pouvaient
 * pas se connecter et aucun écran ne permettait d'en définir un. Désormais :
 * - à la création et à la réinitialisation, un mot de passe provisoire aléatoire est
 *   généré et affiché UNE SEULE FOIS à l'administrateur (seul son empreinte bcrypt est
 *   conservée) ;
 * - l'utilisateur doit le remplacer à sa première connexion : tant qu'il ne l'a pas
 *   fait, l'application ne lui donne accès qu'au changement de mot de passe.
 */

// Sans caractères ambigus à la lecture (0/O, 1/l/I) : le mot de passe est recopié à la main.
const MAJUSCULES = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const MINUSCULES = "abcdefghijkmnopqrstuvwxyz";
const CHIFFRES = "23456789";
const SPECIAUX = "!@#$%&*?-+=";

export const LONGUEUR_PROVISOIRE = 14;
export const LONGUEUR_MINIMALE = 12;

function tirer(alphabet: string): string {
  return alphabet[randomInt(alphabet.length)];
}

/** Mot de passe provisoire : 14 caractères, au moins un de chaque classe, tirage cryptographique. */
export function genererMotDePasseProvisoire(): string {
  const tous = MAJUSCULES + MINUSCULES + CHIFFRES + SPECIAUX;
  const car = [tirer(MAJUSCULES), tirer(MINUSCULES), tirer(CHIFFRES), tirer(SPECIAUX)];
  while (car.length < LONGUEUR_PROVISOIRE) car.push(tirer(tous));
  // Mélange de Fisher-Yates, lui aussi cryptographique.
  for (let i = car.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [car[i], car[j]] = [car[j], car[i]];
  }
  return car.join("");
}

/** Règles d'un mot de passe choisi par l'utilisateur. Liste vide : mot de passe accepté. */
export function motifsRefusMotDePasse(mdp: string, contexte: { email?: string; ancien?: string } = {}): string[] {
  const motifs: string[] = [];
  if (mdp.length < LONGUEUR_MINIMALE) motifs.push(`au moins ${LONGUEUR_MINIMALE} caractères`);
  if (!/[A-Z]/.test(mdp)) motifs.push("une majuscule");
  if (!/[a-z]/.test(mdp)) motifs.push("une minuscule");
  if (!/[0-9]/.test(mdp)) motifs.push("un chiffre");
  if (!/[^A-Za-z0-9]/.test(mdp)) motifs.push("un caractère spécial");
  const identifiant = contexte.email?.split("@")[0]?.toLowerCase();
  if (identifiant && identifiant.length >= 4 && mdp.toLowerCase().includes(identifiant)) {
    motifs.push("ne pas contenir l'identifiant du compte");
  }
  if (contexte.ancien && mdp === contexte.ancien) motifs.push("être différent du mot de passe actuel");
  return motifs;
}
