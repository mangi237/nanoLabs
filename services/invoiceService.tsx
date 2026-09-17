/**
 * Invoice Service
 * STRICT RULES:
 * 1. 5% record management fee on the patient's portion only, charged when the cashier verifies payment.
 * 2. All money goes to the lab. nanoLabs never touches payment rails.
 * 3. TVA is always exempt (0%).
 * 4. Multi-lab = separate invoices.
 */

import { Invoice, InvoiceLine, TestBatch, PaymentMethod, PaymentStatus } from '../types';
import { roundXAF, splitInsurance, applyPlatformFee, sumLines } from '../shared/money';
import { PLATFORM_FEE_PCT } from '../shared/percentage';

const INVOICE_STORAGE_KEY = 'nanolabs_invoices_ledger';

export function getStoredInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(INVOICE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveStoredInvoices(invoices: Invoice[]): void {
  try {
    localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(invoices));
  } catch (e) {
    console.error('Failed to save invoices to storage', e);
  }
}

/**
 * Generates an official diagnostic invoice from a TestBatch and insurance configuration.
 */
export function generateInvoiceForBatch(
  batch: TestBatch,
  options?: {
    insuranceProviderName?: string;
    insurancePolicyNumber?: string;
    insuranceCoveragePercent?: number;
    homeCollectionFee?: number;
    paymentMethod?: PaymentMethod;
    familyProfileId?: string;
    beneficiaryName?: string;
    policyHolderName?: string;
  }
): Invoice {
  const timestamp = new Date().toISOString();
  const dateCode = timestamp.slice(0, 10).replace(/-/g, '');
  const invoiceNumber = `INV-${dateCode}-${batch.batchNumber.slice(-4)}`;
  const invoiceId = `inv_${batch.id}`;

  const lines: InvoiceLine[] = batch.tests.map((t, idx) => ({
    id: `line_${idx}_${t.testId}`,
    testId: t.testId,
    testCode: t.code,
    description: t.name,
    quantity: 1,
    unitPrice: roundXAF(t.basePrice),
    amount: roundXAF(t.basePrice)
  }));

  const subtotal = sumLines(lines);
  const homeFee = roundXAF(options?.homeCollectionFee || 0);
  const grossTotal = subtotal + homeFee;

  // Insurance calculation
  const coveragePct = options?.insuranceCoveragePercent || 0;
  const { coveredAmount, patientShare } = splitInsurance(grossTotal, coveragePct);

  // 5% nanoLabs platform fee applied ONLY to patient share
  const platformFeeAmount = applyPlatformFee(patientShare);

  // Total payable by patient at cashier counter
  const totalPatientDue = patientShare + platformFeeAmount;

  const invoice: Invoice = {
    id: invoiceId,
    invoiceNumber,
    batchId: batch.id,
    patientId: batch.patientId,
    patientName: batch.patientName,
    labId: batch.labId,
    labName: batch.labName,
    lines,
    subtotal,
    homeCollectionFee: homeFee,
    grossTotal,
    insuranceProviderName: options?.insuranceProviderName,
    insurancePolicyNumber: options?.insurancePolicyNumber,
    insuranceCoveragePercent: coveragePct,
    insuranceCoveredAmount: coveredAmount,
    patientShare,
    platformFeePercent: PLATFORM_FEE_PCT,
    platformFeeAmount,
    totalPatientDue,
    tvaRatePercent: 0, // Always exempt
    paymentMethod: options?.paymentMethod,
    paymentStatus: 'pending',
    familyProfileId: options?.familyProfileId,
    beneficiaryName: options?.beneficiaryName,
    policyHolderName: options?.policyHolderName,
    createdAt: timestamp
  };

  // Upsert in storage
  const all = getStoredInvoices();
  const index = all.findIndex((i) => i.id === invoice.id);
  if (index >= 0) {
    all[index] = invoice;
  } else {
    all.unshift(invoice);
  }
  saveStoredInvoices(all);

  return invoice;
}

/**
 * Finds an invoice by its associated batchId.
 */
export function getInvoiceByBatchId(batchId: string): Invoice | undefined {
  const all = getStoredInvoices();
  return all.find((i) => i.batchId === batchId);
}

/**
 * Marks an invoice as verified by cashier.
 */
export function markInvoicePaid(
  invoiceId: string,
  verification: {
    cashierName: string;
    transactionRef?: string;
    payerPhone?: string;
    payerName?: string;
    paymentMethod: PaymentMethod;
  }
): Invoice | undefined {
  const all = getStoredInvoices();
  const index = all.findIndex((i) => i.id === invoiceId);
  if (index < 0) return undefined;

  const inv = all[index];
  inv.paymentStatus = 'verified';
  inv.paymentVerifiedAt = new Date().toISOString();
  inv.verifiedByCashierName = verification.cashierName;
  inv.transactionRef = verification.transactionRef || `TRX-${Date.now().toString().slice(-6)}`;
  inv.payerPhone = verification.payerPhone;
  inv.payerName = verification.payerName;
  inv.paymentMethod = verification.paymentMethod;

  all[index] = inv;
  saveStoredInvoices(all);
  return inv;
}

/**
 * Returns invoices associated with a specific lab.
 */
export function getInvoicesForLab(labId: string): Invoice[] {
  const all = getStoredInvoices();
  if (!labId || labId === 'all') return all;
  return all.filter((i) => !i.labId || i.labId === labId);
}

/**
 * Alias for markInvoicePaid matching cashier screen verification signature.
 */
export function verifyCashierPayment(
  invoiceId: string,
  cashier: { id?: string; name?: string; cashierName?: string } | { cashierName: string; paymentMethod: PaymentMethod; transactionRef?: string; payerPhone?: string; payerName?: string },
  methodOrNothing?: PaymentMethod,
  insuranceUpdate?: { providerName: string; policyNumber: string; coveragePercent: number }
): Invoice | undefined {
  const all = getStoredInvoices();
  const index = all.findIndex((i) => i.id === invoiceId);
  if (index < 0) return undefined;

  const inv = all[index];
  const cashierName = (cashier as any).cashierName || (cashier as any).name || 'Cashier';
  const paymentMethod: PaymentMethod = (cashier as any).paymentMethod || methodOrNothing || 'cash';

  if (insuranceUpdate) {
    inv.insuranceProviderName = insuranceUpdate.providerName;
    inv.insurancePolicyNumber = insuranceUpdate.policyNumber;
    inv.insuranceCoveragePercent = insuranceUpdate.coveragePercent;
    inv.insuranceCoveredAmount = roundXAF((inv.grossTotal * insuranceUpdate.coveragePercent) / 100);
    inv.patientShare = inv.grossTotal - inv.insuranceCoveredAmount;
    inv.platformFeeAmount = roundXAF(inv.patientShare * 0.05);
    inv.totalPatientDue = inv.patientShare + inv.platformFeeAmount;
  }

  inv.paymentStatus = 'verified';
  inv.paymentVerifiedAt = new Date().toISOString();
  inv.verifiedByCashierName = cashierName;
  inv.transactionRef = (cashier as any).transactionRef || `TRX-${Date.now().toString().slice(-6)}`;
  inv.paymentMethod = paymentMethod;

  all[index] = inv;
  saveStoredInvoices(all);
  return inv;
}

