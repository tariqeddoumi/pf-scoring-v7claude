/**
 * Rating Converter Utility - Single Source of Truth
 * Converts numeric scores to letter ratings (AAA, AA, A, etc.)
 */

/**
 * Convert a score (0-100) to a rating scale
 */
export function scoreToRating(score: number): string {
  if (score >= 95) return "AAA";
  if (score >= 85) return "AA";
  if (score >= 75) return "A";
  if (score >= 65) return "BBB";
  if (score >= 55) return "BB";
  if (score >= 45) return "B";
  if (score >= 35) return "CCC";
  if (score >= 25) return "CC";
  if (score >= 15) return "C";
  return "D";
}

/**
 * Alias for compatibility with different naming conventions
 */
export const getRatingFromScore = scoreToRating;

/**
 * Get all rating thresholds (for reference/validation)
 */
export const RATING_THRESHOLDS = {
  AAA: { min: 95, max: 100 },
  AA: { min: 85, max: 94 },
  A: { min: 75, max: 84 },
  BBB: { min: 65, max: 74 },
  BB: { min: 55, max: 64 },
  B: { min: 45, max: 54 },
  CCC: { min: 35, max: 44 },
  CC: { min: 25, max: 34 },
  C: { min: 15, max: 24 },
  D: { min: 0, max: 14 },
} as const;

/**
 * Validate if a score is in a valid rating range
 */
export function isValidRating(rating: string): rating is keyof typeof RATING_THRESHOLDS {
  return rating in RATING_THRESHOLDS;
}
