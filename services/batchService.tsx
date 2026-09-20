/**
 * Test Batch Service
 * Manages the canonical lifecycle of clinical test batches:
 * intake -> collected -> in_transit -> received -> analysis -> validation -> signed -> ready
 */

import { TestBatch, BatchStatus, PaymentStatus, BatchTestItem } from '../types';

const BATCH_STORAGE_KEY = 'nanolabs_batches_ledger';

export function getStoredBatches(): TestBatch[] {
  let batches: TestBatch[] = [];
  try {
    const raw = localStorage.getItem(BATCH_STORAGE_KEY);
    if (raw) {
      batches = JSON.parse(raw);
    }
  } catch (e) {
    batches = [];
  }

  // Also bridge with real bookings from nanolabs_bookings_ledger
  try {
    const rawBookings = localStorage.getItem('nanolabs_bookings_ledger');
    if (rawBookings) {
      const bookingsList: any[] = JSON.parse(rawBookings);
      for (const b of bookingsList) {
        // If this booking is not already in batches as a TestBatch, synthesize it
        const existingIdx = batches.findIndex((x) => x.id === b.id || x.batchNumber === b.bookingCode);

        let batchStatus: BatchStatus = 'intake';
        if (b.overallStatus === 'Completed') {
          batchStatus = 'ready';
        } else if (b.overallStatus === 'Pending_Biologist_Validation' || b.overallStatus === 'Pending_Signature') {
          batchStatus = 'validation';
        } else if (b.overallStatus === 'In_Lab_Testing') {
          batchStatus = 'analysis';
        } else if (b.overallStatus === 'In_Transit') {
          batchStatus = 'in_transit';
        } else if (b.overallStatus === 'Sample_Collected' || b.sampleCollectedAtDate) {
          batchStatus = 'received';
        } else if (b.paymentStatus === 'paid') {
          batchStatus = 'collected';
        } else {
          batchStatus = 'intake';
        }

        const tests: BatchTestItem[] = (b.tests || []).map((t: any, idx: number) => ({
          testId: t.id || `t_${idx}`,
          code: t.code || t.testCode || (t.testName ? t.testName.slice(0, 5).toUpperCase() : 'TEST'),
          name: t.testName || t.name || 'Clinical Test',
          category: t.category || 'biochemistry',
          sampleType: t.sampleType || t.sampleTypeRequired || 'Venous Blood',
          basePrice: t.price || 0,
          resultValue: t.resultValue,
          referenceRange: t.referenceRange || t.normalRange,
          unit: t.unit,
          flag: t.flag || 'normal',
          status: t.status === 'Completed' ? 'validated' : (t.status === 'In_Lab_Testing' ? 'in_analysis' : 'pending'),
          richReportHtml: t.richReportHtml
        }));

        const synthBatch: TestBatch = {
          id: b.id,
          batchNumber: b.bookingCode || `BCH-${b.id.slice(-6)}`,
          patientId: b.patientId || 'demo_patient',
          patientName: b.patientName || 'Patient',
          patientPhone: b.patientPhone,
          patientAge: b.patientAge,
          patientGender: b.patientGender,
          labId: b.labId || 'lab_central',
          labName: b.labName || 'Laboratoire Central d\'Analyses Médicales',
          sampleMode: b.homeCollection ? 'home_collection' : 'walk_in',
          status: batchStatus,
          tests,
          sampleTubeBarcode: b.sampleBarcode || (b.collectedSamples && b.collectedSamples[0]) || `TUBE-${b.bookingCode || b.id}`,
          paymentStatus: b.paymentStatus === 'paid' ? 'verified' : 'unpaid',
          createdAt: b.createdAt || new Date().toISOString(),
          updatedAt: b.updatedAt || new Date().toISOString(),
          signedAt: b.overallStatus === 'Completed' ? (b.completedAt || b.updatedAt) : undefined,
          biologistName: b.biologistName || (b.overallStatus === 'Completed' ? 'Dr. Suzanne Mbongo, MD' : undefined),
          biologistLicense: b.biologistLicense || (b.overallStatus === 'Completed' ? 'ONMC-BIO-9921' : undefined),
          qrAuditHash: b.overallStatus === 'Completed' ? `NL-${b.id}-${b.bookingCode}` : undefined
        };

        if (existingIdx >= 0) {
          // Update existing with live booking status if newer
          batches[existingIdx] = { ...batches[existingIdx], ...synthBatch };
        } else {
          batches.push(synthBatch);
        }
      }
    }
  } catch (err) {
    console.warn('Note on loading real bookings into batch ledger:', err);
  }

  return batches;
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

export function getBatchesForPatient(patientId: string, patientPhone?: string, patientName?: string): TestBatch[] {
  const all = getStoredBatches();
  const filtered = all.filter((b) => {
    if (b.patientId === patientId) return true;
    if (patientPhone && b.patientPhone && b.patientPhone.replace(/\s+/g, '') === patientPhone.replace(/\s+/g, '')) return true;
    if (patientName && b.patientName && b.patientName.toLowerCase() === patientName.toLowerCase()) return true;
    if (patientId === 'demo_patient' && (!b.patientId || b.patientId === 'demo_patient' || b.patientName.includes('Claire Ngo'))) return true;
    return false;
  });

  return filtered.length > 0 ? filtered : all;
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
