/**
 * Affichage des pondérations du modèle de scoring.
 *
 * Les poids sont stockés en valeurs relatives au sein d'une fratrie — 10 à 15 pour les
 * domaines, 20 à 50 pour les critères — et le moteur les divise par la somme de la
 * fratrie. Un poids de 10 ne vaut donc ni « 10 % », ni « 1000 % », mais la part que
 * 10 représente parmi ses frères.
 *
 * Les écrans en donnaient trois lectures : « 10 % » (le poids brut suffixé d'un
 * pourcentage), « 1000 % » (le poids multiplié par cent, comme s'il s'agissait d'une
 * fraction) et « ×10 ». Les deux premières sont fausses. Ce module est la seule
 * conversion, pour que tous les écrans disent la même chose.
 */

/** Somme des poids d'une fratrie, les poids absents comptant pour zéro. */
export function sommeFratrie(
  freres: { weight?: number | null }[] | null | undefined
): number {
  return (freres ?? []).reduce((total, f) => total + (f.weight ?? 0), 0);
}

/**
 * Part d'un poids dans sa fratrie, en pourcentage.
 *
 * Renvoie null si la somme est nulle : la part n'a alors pas de sens, et aucun
 * pourcentage inventé ne doit s'afficher.
 */
export function partRelative(
  poids: number | null | undefined,
  somme: number
): number | null {
  if (poids === null || poids === undefined) return null;
  if (!Number.isFinite(somme) || somme <= 0) return null;
  return (poids / somme) * 100;
}

/**
 * Libellé principal : la part effective dans la fratrie.
 *
 * C'est la seule grandeur qui corresponde à ce que fait le moteur, et donc la seule
 * qu'un paramétreur puisse relier au résultat.
 */
export function formatPart(
  poids: number | null | undefined,
  somme: number
): string | null {
  const part = partRelative(poids, somme);
  if (part === null) return null;
  return `${part.toFixed(part < 10 ? 1 : 0).replace(".", ",")} %`;
}

/** Libellé détaillé, pour une infobulle : la part, puis le poids brut saisi. */
export function formatPoidsDetail(
  poids: number | null | undefined,
  somme: number
): string {
  if (poids === null || poids === undefined) return "Sans pondération";
  const part = formatPart(poids, somme);
  const brut = `poids saisi ${String(poids).replace(".", ",")}`;
  if (part === null) {
    return `${brut} — part indéterminée, la fratrie totalise 0`;
  }
  return `${part} du niveau — ${brut} sur ${String(somme).replace(".", ",")}`;
}
