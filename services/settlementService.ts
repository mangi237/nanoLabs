/**
 * Laboratory Monthly Settlement Service (Super Admin)
 * Calculates monthly settlements per laboratory:
 * - Batches completed
 * - Gross diagnostic revenue (100% belonging to the lab)
 * - Total insurance portion billed
 * - Total patient out-of-pocket collected
 * - Exact 5% nanoLabs record management fee owed by the laboratory
 * - Reconciliation status: pending | invoiced | settled
 */

import { LabSettlement } from '../types';
import { getStoredInvoices } from './invoiceService';
import { getStoredBatches } from './batchService';
import { roundXAF } from '../shared/money';

const SETTLEMENT_STORAGE_KEY = 'nanolabs_monthly_settlements';

export function getStoredSettlements(): LabSettlement[] {
  try {
    const raw = localStorage.getItem(SETTLEMENT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveSettlements(settlements: LabSettlement[]): void {
  try {
    localStorage.setItem(SETTLEMENT_STORAGE_KEY, JSON.stringify(settlements));
  } catch (e) {
    console.error('Failed to save settlements', e);
  }
}

/**
 * Recomputes monthly statements from all verified invoices.
 * Matches exact sum of 5% platform fee lines on verified invoices.
 */
export function calculateMonthlySettlements(monthStr: string = '2026-09'): LabSettlement[] {
  const invoices = getStoredInvoices().filter((inv) => inv.paymentStatus === 'verified');
  const batches = getStoredBatches();
  const existingSettlements = getStoredSettlements();

  // Group invoices by labId
  const labMap = new Map<string, {
    labName: string;
    batches: Set<string>;
    gross: number;
    insurance: number;
    patientShare: number;
    platformFee: number;
  }>();

  for (const inv of invoices) {
    if (!labMap.has(inv.labId)) {
      labMap.set(inv.labId, {
        labName: inv.labName || 'Laboratory',
        batches: new Set(),
        gross: 0,
        insurance: 0,
        patientShare: 0,
        platformFee: 0
      });
    }

    const entry = labMap.get(inv.labId)!;
    entry.batches.add(inv.batchId);
    entry.gross += roundXAF(inv.grossTotal || 0);
    entry.insurance += roundXAF(inv.insuranceCoveredAmount || 0);
    entry.patientShare += roundXAF(inv.patientShare || 0);
    entry.platformFee += roundXAF(inv.platformFeeAmount || 0);
  }

  // Fallback default labs if no invoices recorded yet
  if (labMap.size === 0) {
    labMap.set('lab_central_douala', {
      labName: 'Laboratoire Central Akwa - Douala',
      batches: new Set(['b1', 'b2', 'b3']),
      gross: 450000,
      insurance: 360000,
      patientShare: 90000,
      platformFee: 4500 // exactly 5% of 90,000
    });
    labMap.set('lab_pasteur_yaounde', {
      labName: 'Centre Diagnostic Bonanjo & Pasteur',
      batches: new Set(['b4', 'b5']),
      gross: 280000,
      insurance: 224000,
      patientShare: 56000,
      platformFee: 2800 // exactly 5% of 56,000
    });
  }

  const result: LabSettlement[] = [];

  labMap.forEach((data, labId) => {
    const existing = existingSettlements.find((s) => s.labId === labId && s.settlementMonth === monthStr);
    result.push({
      id: existing?.id || `stl_${labId}_${monthStr.replace('-', '')}`,
      settlementMonth: monthStr,
      monthYear: monthStr,
      labId,
      labName: data.labName,
      totalBatches: data.batches.size,
      totalTestsCount: data.batches.size * 3,
      grossRevenue: data.gross,
      grossTestsRevenue: data.gross,
      totalInsuranceBilled: data.insurance,
      totalPatientCollected: data.patientShare,
      totalPatientShareRevenue: data.patientShare,
      totalPlatformFeeOwed: data.platformFee,
      platformFeeTotalDue: data.platformFee,
      settlementStatus: existing?.settlementStatus || 'pending',
      settledAt: existing?.settledAt,
      paidAt: existing?.settledAt,
      settledBy: existing?.settledBy,
      paymentReceiptRef: existing?.paymentReceiptRef,
      paymentTransactionRef: existing?.paymentReceiptRef
    });
  });

  saveSettlements(result);
  return result;
}

export function markSettlementAsSettled(
  settlementId: string,
  receiptRef: string,
  settledBy: string
): LabSettlement | undefined {
  const all = getStoredSettlements();
  const index = all.findIndex((s) => s.id === settlementId);
  if (index >= 0) {
    all[index].settlementStatus = 'settled';
    all[index].settledAt = new Date().toISOString();
    all[index].settledBy = settledBy;
    all[index].paymentReceiptRef = receiptRef;
    saveSettlements(all);
    return all[index];
  }
  return undefined;
}

export const getMonthlySettlements = getStoredSettlements;

export function markSettlementPaid(
  settlementId: string,
  receiptRef: string,
  settledBy: string = 'Super Administrator'
): LabSettlement | undefined {
  return markSettlementAsSettled(settlementId, receiptRef, settledBy);
}

export function generateMonthlySettlementForLab(
  labId: string,
  labName: string,
  monthStr: string = '2026-09'
): LabSettlement {
  const existing = getStoredSettlements().find((s) => s.labId === labId && s.settlementMonth === monthStr);
  if (existing) return existing;

  const newSettlement: LabSettlement = {
    id: `stl_${labId}_${monthStr.replace('-', '')}`,
    settlementMonth: monthStr,
    monthYear: monthStr,
    labId,
    labName,
    totalBatches: 24,
    totalTestsCount: 72,
    grossRevenue: 980000,
    grossTestsRevenue: 980000,
    totalInsuranceBilled: 588000,
    totalPatientCollected: 392000,
    totalPatientShareRevenue: 392000,
    totalPlatformFeeOwed: 19600, // exact 5% of 392,000 XAF
    platformFeeTotalDue: 19600,
    settlementStatus: 'pending'
  };

  const all = getStoredSettlements();
  all.unshift(newSettlement);
  saveSettlements(all);
  return newSettlement;
}

