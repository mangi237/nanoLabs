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
  } catch (error) {
    throw new Error('Stored records could not be read. Please contact support before continuing.');
  }
}

export function saveSettlements(settlements: LabSettlement[]): void {
  try {
    localStorage.setItem(SETTLEMENT_STORAGE_KEY, JSON.stringify(settlements));
  } catch (e) {
    console.error('Failed to save settlements', e);
    throw e;
  }
}

/**
 * Recomputes monthly statements from all verified invoices.
 * Matches exact sum of 5% platform fee lines on verified invoices.
 */
export function calculateMonthlySettlements(monthStr: string = '2026-09'): LabSettlement[] {
  const invoices = getStoredInvoices().filter((inv) => inv.paymentStatus === 'verified' && (inv.paymentVerifiedAt ?? '').startsWith(monthStr));
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
      totalTestsCount: batches.filter(batch => data.batches.has(batch.id)).reduce((count, batch) => count + batch.tests.length, 0),
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

  const settlement = calculateMonthlySettlements(monthStr).find(record => record.labId === labId);
  if (!settlement) throw new Error('No verified invoice records exist for this laboratory and month.');
  return settlement;
}

