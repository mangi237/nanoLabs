/**
 * Canonical Batch Grouping
 * STRICT RULE: Multi-lab bookings are ALWAYS partitioned into separate specimen batches,
 * separate invoices, and separate authentic lab reports.
 */

import { TestBatch, BatchTestItem, SampleMode, BatchStatus } from '../types';

export interface BatchCandidateTest {
  testId?: string;
  id?: string;
  code?: string;
  testCode?: string;
  name?: string;
  testName?: string;
  category?: string;
  sampleType?: string;
  price?: number;
  basePrice?: number;
}

export interface BatchLabInfo {
  id: string;
  name: string;
}

export interface BatchPatientInfo {
  id: string;
  name: string;
  phone?: string;
  age?: number;
  gender?: string;
}

/**
 * Groups an array of clinical tests for a specific lab and patient into a canonical TestBatch.
 */
export function groupIntoBatch(
  tests: BatchCandidateTest[],
  lab: BatchLabInfo,
  patient: BatchPatientInfo,
  options?: {
    sampleMode?: SampleMode;
    tubeBarcode?: string;
    sampleTubeBarcode?: string;
    recommendingDoctorId?: string;
    recommendingDoctorName?: string;
    notes?: string;
  }
): TestBatch {
  const timestamp = new Date().toISOString();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const batchNumber = `BCH-${dateCode}-${randomSuffix}`;
  const batchId = `batch_${Date.now()}_${randomSuffix}`;

  const batchTests: BatchTestItem[] = tests.map((t, index) => ({
    testId: t.testId || t.id || `test_${index}`,
    code: t.code || t.testCode || `TEST-${index + 1}`,
    name: t.name || t.testName || 'Diagnostic Test',
    category: t.category || 'biochemistry',
    sampleType: t.sampleType || 'Whole Blood',
    basePrice: t.basePrice || t.price || 0,
    status: 'pending'
  }));

  const testBatch: TestBatch = {
    id: batchId,
    batchNumber,
    patientId: patient.id,
    patientName: patient.name,
    patientPhone: patient.phone,
    patientAge: patient.age,
    patientGender: patient.gender,
    labId: lab.id,
    labName: lab.name,
    sampleMode: options?.sampleMode || 'walk_in',
    status: 'intake',
    tests: batchTests,
    recommendingDoctorId: options?.recommendingDoctorId,
    recommendingDoctorName: options?.recommendingDoctorName,
    sampleTubeBarcode: options?.tubeBarcode || options?.sampleTubeBarcode || `TUBE-${batchNumber}`,
    paymentStatus: 'pending',
    notes: options?.notes,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  return testBatch;
}

/**
 * Given a list of items that may belong to multiple laboratories, partitions them by labId.
 */
export function partitionTestsByLab<T extends { labId?: string }>(
  items: T[]
): Map<string, T[]> {
  const labMap = new Map<string, T[]>();
  for (const item of items) {
    const labKey = item.labId || 'default_lab';
    if (!labMap.has(labKey)) {
      labMap.set(labKey, []);
    }
    labMap.get(labKey)!.push(item);
  }
  return labMap;
}
