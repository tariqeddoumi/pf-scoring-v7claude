/**
 * Couleurs d'affichage des scores et des ratings.
 *
 * Ces seuils étaient recopiés dans cinq endroits — LiveScorePanel, DomainSidebar,
 * deux pages de liste et des ternaires en ligne dans l'administration — chacun avec
 * ses propres couleurs brutes. Une seule source ici, exprimée en jetons sémantiques,
 * pour que la palette suive le thème au lieu d'être figée en vert, jaune et rouge.
 */

export type ScoreTone = "success" | "warning" | "destructive" | "muted";

/** Seuils d'appréciation d'un score sur 100. */
export const SCORE_THRESHOLDS = { favorable: 70, vigilance: 50 } as const;

export function scoreTone(score: number | null | undefined): ScoreTone {
  if (score === null || score === undefined || Number.isNaN(score)) return "muted";
  if (score >= SCORE_THRESHOLDS.favorable) return "success";
  if (score >= SCORE_THRESHOLDS.vigilance) return "warning";
  return "destructive";
}

const TEXT: Record<ScoreTone, string> = {
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  muted: "text-muted-foreground",
};

const BAR: Record<ScoreTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  muted: "bg-muted",
};

const BADGE: Record<ScoreTone, string> = {
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
  destructive: "text-destructive bg-destructive/10",
  muted: "text-muted-foreground bg-muted/50",
};

/** Classe de texte pour un score. */
export function scoreTextClass(score: number | null | undefined): string {
  return TEXT[scoreTone(score)];
}

/** Classe de remplissage pour une barre de progression. */
export function scoreBarClass(score: number | null | undefined): string {
  return BAR[scoreTone(score)];
}

/** Classe de pastille (texte + fond teinté) pour un score. */
export function scoreBadgeClass(score: number | null | undefined): string {
  return BADGE[scoreTone(score)];
}

/** Les trois classes d'un coup, pour les panneaux qui affichent score, barre et pastille. */
export function scoreClasses(score: number | null | undefined) {
  const tone = scoreTone(score);
  return { tone, text: TEXT[tone], bar: BAR[tone], badge: BADGE[tone] };
}

/**
 * Pastille d'un rating de crédit. La famille de la note prime sur sa lettre exacte :
 * AAA et AA sont favorables, A et BBB acceptables, le reste dégradé.
 */
export function ratingTone(rating: string | null | undefined): ScoreTone | "primary" {
  if (!rating) return "muted";
  const r = rating.toUpperCase();
  if (r.startsWith("AA")) return "success";
  if (r === "A" || r.startsWith("BBB")) return "primary";
  if (r.startsWith("BB") || r === "B") return "warning";
  return "destructive";
}

export function ratingBadgeClass(rating: string | null | undefined): string {
  const tone = ratingTone(rating);
  return tone === "primary" ? "text-primary bg-primary/10" : BADGE[tone];
}

/** Classe de remplissage pour une barre représentant un rating. */
export function ratingBarClass(rating: string | null | undefined): string {
  const tone = ratingTone(rating);
  return tone === "primary" ? "bg-primary" : BAR[tone];
}
