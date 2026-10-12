/**
 * Couleur principale personnalisable (paramétrage général ou banque) : le texte posé
 * dessus doit rester lisible. Le blanc fixe devenait illisible sur une couleur claire
 * (jaune, vert d'eau…). On choisit blanc ou presque-noir, le plus contrasté des deux.
 */

/** Clarté perçue entre 0 (noir) et 1 (blanc), ou null si la couleur n'est pas lue. */
export function clarte(couleur: string): number | null {
  const c = couleur.trim().toLowerCase();
  const hex = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split("").map((x) => x + x).join("") : hex[1];
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    // Luminance relative (WCAG), ramenée à une clarté perçue.
    return Math.cbrt(0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b));
  }
  const oklch = c.match(/^oklch\(\s*([\d.]+)(%?)/);
  if (oklch) return Number(oklch[1]) / (oklch[2] ? 100 : 1);
  return null;
}

const TEXTE_FONCE = "oklch(0.2 0.02 250)";
const TEXTE_CLAIR = "oklch(1 0 0)";
/** Luminance relative (WCAG) du texte foncé : clarté 0,2 au cube. */
const LUMINANCE_TEXTE_FONCE = 0.2 ** 3;

/**
 * Couleur du texte à poser sur la couleur donnée (null : laisser celle du thème) :
 * celle des deux qui offre le meilleur rapport de contraste WCAG 2.x,
 * (L1 + 0,05) / (L2 + 0,05). Un seuil sur la clarté choisissait le blanc sur des
 * bleus moyens (#0ea5e9 : 2,8:1) alors que le texte foncé y dépasse 6:1.
 */
export function texteSur(couleur: string): string | null {
  const l = clarte(couleur);
  if (l === null) return null;
  const luminance = l ** 3;
  const contrasteClair = 1.05 / (luminance + 0.05);
  const contrasteFonce = (luminance + 0.05) / (LUMINANCE_TEXTE_FONCE + 0.05);
  return contrasteFonce > contrasteClair ? TEXTE_FONCE : TEXTE_CLAIR;
}
