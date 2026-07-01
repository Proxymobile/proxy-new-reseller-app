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

/**
 * Public pricing tiers shown on marketing pages (homepage slider + country
 * pages). Kept in sync with the slider anchors in customGbPrice().
 */
export const GB_TIERS = [
  { gb: 1, price: 8, perGb: 8.0, discount: 0 },
  { gb: 5, price: 35, perGb: 7.0, discount: 13 },
  { gb: 10, price: 65, perGb: 6.5, discount: 19 },
  { gb: 25, price: 150, perGb: 6.0, discount: 25 },
  { gb: 50, price: 275, perGb: 5.5, discount: 31 },
  { gb: 100, price: 500, perGb: 5.0, discount: 38 },
] as const;
