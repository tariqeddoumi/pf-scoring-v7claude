/**
 * Logo de l'outil ou d'une banque : adresse https://, chemin /… servi par l'application,
 * ou image déposée depuis l'administration et enregistrée en ligne (data:image/…;base64).
 * L'image déposée est bornée : elle est servie avec chaque page.
 */
export const LOGO_TAILLE_MAX = 150 * 1024;
export const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"] as const;

const DATA_URL = /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/;

/** Motif du refus, ou null si la valeur est acceptable (vide = pas de logo). */
export function motifLogoInvalide(v: string | null | undefined): string | null {
  if (!v) return null;
  if (/^https:\/\/\S+$/.test(v) || /^\/[^\s]*$/.test(v)) return null;
  if (DATA_URL.test(v)) {
    // base64 : 4 caractères pour 3 octets
    const octets = Math.floor(((v.length - v.indexOf(",") - 1) * 3) / 4);
    return octets > LOGO_TAILLE_MAX ? `Image trop lourde : ${Math.ceil(LOGO_TAILLE_MAX / 1024)} Ko au plus` : null;
  }
  return "Le logo doit être une adresse https://, un chemin /… ou une image PNG, JPEG, WebP ou SVG déposée";
}
