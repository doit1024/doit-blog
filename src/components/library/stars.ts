/**
 * Map a Notion「评分」 onto five stars.
 *
 * The catalog stores the raw number and does not record a scale.
 * A value already in 0–5 is that many stars. A value above 5 and at
 * most 10 is a 10-point score (the usual Douban scale) and is divided
 * by 2. Above 10 is capped at 10 before that division, so the row
 * never draws more than five stars.
 *
 * A half star is used only when the normalized score already lands on
 * a half (4.5, or 9 on the 10-point scale). Any other fraction rounds
 * to the nearest whole star.
 */
export const STAR_TOTAL = 5;

export type StarDisplay = {
  filled: number;
  half: boolean;
  scoreLabel: string;
  ariaLabel: string;
};

const HALF_EPSILON = 1e-6;

export function normalizeToFive(raw: number): number {
  const value = Math.max(0, raw);
  if (value <= STAR_TOTAL) return value;
  return Math.min(value, STAR_TOTAL * 2) / 2;
}

export function starDisplay(raw: number): StarDisplay | null {
  if (!Number.isFinite(raw)) return null;

  const five = normalizeToFive(raw);
  const nearestHalf = Math.round(five * 2) / 2;
  const onHalfGrid = Math.abs(five - nearestHalf) < HALF_EPSILON;
  const snapped = Math.min(
    STAR_TOTAL,
    Math.max(0, onHalfGrid ? nearestHalf : Math.round(five))
  );
  const half = Math.abs((snapped % 1) - 0.5) < HALF_EPSILON;
  const filled = half ? Math.floor(snapped) : snapped;
  const scoreLabel = half ? `${filled}.5` : String(filled);

  return {
    filled,
    half,
    scoreLabel,
    ariaLabel: `评分 ${scoreLabel}，满分 ${STAR_TOTAL}`,
  };
}
