/**
 * Shared Currency & Financial Arithmetic (XAF)
 * All monetary amounts are integers in Central African CFA Franc (XAF).
 * TVA is ALWAYS 0% (exempt for clinical medical diagnostic tests).
 * nanoLabs 5% fee applies strictly to the patient's out-of-pocket portion.
 */

import { PLATFORM_FEE_PCT, applyPercentage } from './percentage';

/**
 * Rounds any floating calculation to strict integer XAF
 */
export function roundXAF(amount: number): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round(amount);
}

/**
 * Sums an array of objects having an amount property
 */
export function sumLines<T extends { amount: number }>(lines: T[]): number {
  if (!lines || lines.length === 0) return 0;
  return lines.reduce((acc, line) => acc + roundXAF(line.amount || 0), 0);
}

/**
 * Splits gross diagnostic total into Insurance covered portion and Patient out-of-pocket share.
 * Rounding rule: coveredAmount is rounded; patientShare = total - coveredAmount
 */
export function splitInsurance(
  total: number,
  insuranceCoveragePercent: number
): { coveredAmount: number; patientShare: number } {
  const roundedTotal = roundXAF(total);
  if (!insuranceCoveragePercent || insuranceCoveragePercent <= 0) {
    return { coveredAmount: 0, patientShare: roundedTotal };
  }
  const cappedPct = Math.min(100, Math.max(0, insuranceCoveragePercent));
  const coveredAmount = applyPercentage(roundedTotal, cappedPct);
  const patientShare = Math.max(0, roundedTotal - coveredAmount);
  return { coveredAmount, patientShare };
}

/**
 * Calculates the nanoLabs platform record management fee on the patient's portion only.
 * 0% fee on insurance portion.
 */
export function applyPlatformFee(patientAmount: number): number {
  return applyPercentage(roundXAF(patientAmount), PLATFORM_FEE_PCT);
}

/**
 * Formats an amount as an integer CFA Franc string e.g. "12,500 XAF"
 */
export function formatXAF(amount: number): string {
  return `${roundXAF(amount).toLocaleString('fr-FR')} XAF`;
}
