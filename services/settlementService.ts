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

  // Also bridge with real paid bookings from nanolabs_bookings_ledger if any
  try {
    const rawLedger = localStorage.getItem('nanolabs_bookings_ledger');
    if (rawLedger) {
      const bookings = JSON.parse(rawLedger);
      if (Array.isArray(bookings)) {
        bookings.forEach((b: any) => {
          const isPaid = b.paymentStatus === 'paid' || b.paymentStatus === 'verified' || b.paid === true || b.invoiceStatus === 'paid';
          if (isPaid && b.labId) {
            if (!labMap.has(b.labId)) {
              labMap.set(b.labId, {
                labName: b.labName || 'Laboratoire Partenaire',
                batches: new Set(),
                gross: 0,
                insurance: 0,
                patientShare: 0,
                platformFee: 0
              });
            }
            const entry = labMap.get(b.labId)!;
            const batchKey = b.id || b.bookingCode || 'batch';
            if (!entry.batches.has(batchKey)) {
              entry.batches.add(batchKey);
              const total = Number(b.totalAmount || b.actualPaidAmount || b.price || 0);
              const fee = Number(b.platformFeeAmount || Math.round(total * 0.05));
              entry.gross += roundXAF(total);
              entry.patientShare += roundXAF(total);
              entry.platformFee += roundXAF(fee);
            }
          }
        });
      }
    }
  } catch (err) {
    console.warn('Error reading bookings ledger in settlementService', err);
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
      totalTestsCount: data.batches.size,
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
    totalBatches: 0,
    totalTestsCount: 0,
    grossRevenue: 0,
    grossTestsRevenue: 0,
    totalInsuranceBilled: 0,
    totalPatientCollected: 0,
    totalPatientShareRevenue: 0,
    totalPlatformFeeOwed: 0,
    platformFeeTotalDue: 0,
    settlementStatus: 'pending'
  };

  const all = getStoredSettlements();
  all.unshift(newSettlement);
  saveSettlements(all);
  return newSettlement;
}

