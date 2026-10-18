/** Codes d'identification du modèle Project Finance (formats de l'outil Excel). */

export const FORMAT_CODE_PROJET = /^PF-\d{4}-\d{4}$/;
export const FORMAT_RADICAL = /^\d{7}$/;

export const MESSAGE_CODE_PROJET = "Le code projet suit le format PF-AAAA-NNNN, par exemple PF-2026-0014";
export const MESSAGE_RADICAL = "Le radical compte exactement 7 chiffres, zéros de tête compris (ex. 0041027)";

/**
 * Prochain code projet de l'année : PF-AAAA-NNNN, NNNN étant le plus grand numéro
 * déjà attribué cette année dans la banque, plus un.
 */
export function proposerCodeProjet(existants: (string | null | undefined)[], annee = new Date().getFullYear()): string {
  const prefixe = `PF-${annee}-`;
  const max = existants.reduce<number>((m, c) => {
    if (!c || !c.startsWith(prefixe) || !FORMAT_CODE_PROJET.test(c)) return m;
    return Math.max(m, Number(c.slice(prefixe.length)));
  }, 0);
  return `${prefixe}${String(max + 1).padStart(4, "0")}`;
}

export const NATURES_CREDIT = [
  "Crédit d'investissement (moyen et long terme)",
  "Crédit relais (TVA, subventions)",
  "Ligne de fonctionnement (BFR)",
  "Garantie ou caution",
  "Couverture (taux ou change)",
  "Autre",
] as const;
export const DEVISES_CREDIT = ["MAD", "EUR", "USD", "Autre"] as const;
