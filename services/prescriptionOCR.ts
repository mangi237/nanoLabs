import { apiFetch } from './apiClient';
/**
 * Clinical Prescription OCR Service
 * Sends captured prescription images/PDFs to the server-side Gemini 3.8 Flash OCR endpoint
 * (/api/ocr/prescription) and cross-references extracted lines against the CEMAC test catalog.
 */

import { parsePrescriptionText, MatchedPrescriptionTest, MASTER_TEST_DICTIONARY } from '../core/scanner';

export interface PrescriptionScanResult {
  matchedTests: MatchedPrescriptionTest[];
  unmatchedLines: string[];
  rawDetectedText: string;
  detectedDoctorName?: string;
  detectedHospital?: string;
  prescriptionDate?: string;
  errorMessage?: string;
}

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve({
        base64,
        mimeType: file.type || 'image/jpeg',
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export async function scanPrescriptionDocument(
  source: string | File
): Promise<PrescriptionScanResult> {
  let extractedText = '';
  let detectedTests: string[] = [];
  let detectedDoctorName: string | undefined;
  let detectedHospital: string | undefined;
  let prescriptionDate: string | undefined;
  let errorMessage: string | undefined;

  if (typeof source === 'string') {
    if (source.startsWith('data:')) {
      const mimeMatch = source.match(/^data:([^;]+);base64,(.*)$/);
      const mimeType = mimeMatch?.[1] || 'image/jpeg';
      const imageBase64 = mimeMatch?.[2] || source;
      try {
        const res = await apiFetch('/api/ocr/prescription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64, mimeType }),
        });
        const data = await res.json();
        extractedText = data.rawText || '';
        detectedTests = Array.isArray(data.detectedTests) ? data.detectedTests : [];
        detectedDoctorName = data.detectedDoctorName;
        detectedHospital = data.detectedHospital;
        prescriptionDate = data.prescriptionDate;
        if (!extractedText && data.message) errorMessage = data.message;
      } catch (err: any) {
        errorMessage = err?.message || 'Unable to reach OCR service.';
      }
    } else {
      extractedText = source;
    }
  } else {
    try {
      const { base64, mimeType } = await fileToBase64(source);
      const res = await apiFetch('/api/ocr/prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });
      const data = await res.json();
      extractedText = data.rawText || '';
      detectedTests = Array.isArray(data.detectedTests) ? data.detectedTests : [];
      detectedDoctorName = data.detectedDoctorName;
      detectedHospital = data.detectedHospital;
      prescriptionDate = data.prescriptionDate;
      if (!extractedText && data.message) errorMessage = data.message;
    } catch (err: any) {
      errorMessage = err?.message || 'Failed to scan uploaded prescription.';
    }
  }

  const combinedInput = [
    ...detectedTests,
    extractedText,
  ]
    .filter(Boolean)
    .join('\n');

  const { matched, unmatched } = parsePrescriptionText(combinedInput);

  return {
    matchedTests: matched,
    unmatchedLines: unmatched,
    rawDetectedText: combinedInput,
    detectedDoctorName,
    detectedHospital,
    prescriptionDate,
    errorMessage,
  };
}

export { MASTER_TEST_DICTIONARY };
