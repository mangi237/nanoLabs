/**
 * Test Batch Service
 * Manages the canonical lifecycle of clinical test batches:
 * intake -> collected -> in_transit -> received -> analysis -> validation -> signed -> ready
 */

import { TestBatch, BatchStatus, PaymentStatus, BatchTestItem } from '../types';

const BATCH_STORAGE_KEY = 'nanolabs_batches_ledger';

export function getStoredBatches(): TestBatch[] {
  try {
    const raw = localStorage.getItem(BATCH_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveStoredBatches(batches: TestBatch[]): void {
  try {
    localStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify(batches));
  } catch (e) {
    console.error('Failed to save batches to storage', e);
  }
}

export function saveBatch(batch: TestBatch): void {
  const all = getStoredBatches();
  const index = all.findIndex((b) => b.id === batch.id);
  if (index >= 0) {
    all[index] = { ...batch, updatedAt: new Date().toISOString() };
  } else {
    all.unshift({ ...batch, updatedAt: new Date().toISOString() });
  }
  saveStoredBatches(all);
}

export function getBatchById(id: string): TestBatch | undefined {
  const all = getStoredBatches();
  return all.find((b) => b.id === id);
}

export function getBatchesForPatient(patientId: string): TestBatch[] {
  const all = getStoredBatches();
  return all.filter((b) => b.patientId === patientId);
}

export function getBatchesForLab(labId: string): TestBatch[] {
  const all = getStoredBatches();
  return all.filter((b) => b.labId === labId);
}

/**
 * Checks if a home collection batch is blocked from dispatch.
 * RULE: Blocks home dispatch until cashier verifies payment.
 */
export function isHomeDispatchBlocked(batch: TestBatch): boolean {
  if (batch.sampleMode !== 'home_collection') return false;
  return batch.paymentStatus !== 'verified';
}

/**
 * Updates status of a batch with validation.
 */
export function updateBatchStatus(
  batchId: string,
  newStatus: BatchStatus,
  extra?: {
    biologistName?: string;
    biologistLicense?: string;
    notes?: string;
  }
): TestBatch | undefined {
  const all = getStoredBatches();
  const index = all.findIndex((b) => b.id === batchId);
  if (index < 0) return undefined;

  const batch = all[index];

  // Block home collection dispatch if payment not verified
  if (newStatus === 'in_transit' && isHomeDispatchBlocked(batch)) {
    throw new Error('Home dispatch blocked: Payment must be verified by the cashier before transit begins.');
  }

  const timestamp = new Date().toISOString();
  batch.status = newStatus;
  batch.updatedAt = timestamp;

  if (newStatus === 'collected') {
    batch.collectedAt = timestamp;
  } else if (newStatus === 'received') {
    batch.receivedAt = timestamp;
  } else if (newStatus === 'signed' || newStatus === 'ready') {
    batch.signedAt = timestamp;
    if (extra?.biologistName) batch.biologistName = extra.biologistName;
    if (extra?.biologistLicense) batch.biologistLicense = extra.biologistLicense;
    batch.qrAuditHash = `NL-${batch.id}-${Date.now().toString(36).toUpperCase()}`;
  }

  if (extra?.notes) {
    batch.notes = extra.notes;
  }

  all[index] = batch;
  saveStoredBatches(all);
  return batch;
}

/**
 * Updates individual test results inside a batch during analysis.
 */
export function updateBatchTestResult(
  batchId: string,
  testId: string,
  data: {
    resultValue: string;
    referenceRange?: string;
    unit?: string;
    flag?: 'normal' | 'low' | 'high' | 'critical';
  }
): TestBatch | undefined {
  const all = getStoredBatches();
  const index = all.findIndex((b) => b.id === batchId);
  if (index < 0) return undefined;

  const batch = all[index];
  const testIndex = batch.tests.findIndex((t) => t.testId === testId);
  if (testIndex >= 0) {
    batch.tests[testIndex] = {
      ...batch.tests[testIndex],
      ...data,
      status: 'validated'
    };
    batch.updatedAt = new Date().toISOString();
    all[index] = batch;
    saveStoredBatches(all);
  }
  return batch;
}
