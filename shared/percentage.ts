/**
 * Shared Percentage Configuration & Math
 * STRICT RULE: PLATFORM_FEE_PCT is 5% strictly on the patient portion.
 * The constant 5 appears only in this file.
 */

export const PLATFORM_FEE_PCT = 5;

/**
 * Applies a percentage and returns integer XAF
 */
export function applyPercentage(amount: number, pct: number): number {
  if (!amount || amount <= 0 || !pct || pct <= 0) {
    return 0;
  }
  return Math.round((amount * pct) / 100);
}
