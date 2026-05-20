/**
 * Sliding-scale pricing for custom GB amounts.
 *
 * Anchored to existing plan boundaries:
 *   5 GB  -> $35  ($7.00/GB)   [Starter]
 *   25 GB -> $150 ($6.00/GB)   [Pro]
 *   100 GB -> $500 ($5.00/GB)  [Scale]
 *
 * Per-GB rate interpolates linearly between anchors,
 * so larger purchases are progressively cheaper.
 */
export function customGbPrice(gb: number): number {
  if (gb <= 0) return 0;
  if (gb <= 5) return Math.round(gb * 7);
  if (gb <= 25) {
    const ratePerGB = 7 - (gb - 5) / 20; // 7 -> 6 as gb goes 5 -> 25
    return Math.round(gb * ratePerGB);
  }
  // 25 < gb <= 100
  const capped = Math.min(gb, 100);
  const ratePerGB = 6 - (capped - 25) / 75; // 6 -> 5 as gb goes 25 -> 100
  return Math.round(capped * ratePerGB);
}

export function customGbRatePerGB(gb: number): number {
  if (gb <= 0) return 0;
  const total = customGbPrice(gb);
  return total / gb;
}

export const CUSTOM_DURATION_DAYS = 30;
export const CUSTOM_MIN_GB = 1;
export const CUSTOM_MAX_GB = 100;
