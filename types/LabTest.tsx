// types/LabTest.ts
import { Timestamp } from 'firebase/firestore';
export interface LabTest {
  id?: string;
  patientId: string;
  patientName: string;
  technicianId: string;
  technicianName: string;
  testType: LabTestType;
  result: 'positive' | 'negative' | 'inconclusive' | 'pending';
  values: LabTestValues;
  notes?: string;
  testImage?: string;
  status: 'completed' | 'pending' | 'cancelled';
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface LabTestCreateData {
  patientId: string;
  patientName: string;
  testType: LabTestType;
  result: 'positive' | 'negative' | 'inconclusive' | 'pending';
  values: LabTestValues;
  notes?: string;
  testImage?: string;
}

export type LabTestType = 
  | 'blood_test' 
  | 'urinalysis'
  | 'ct_scan'
  | 'mri'
  | 'x_ray'
  | 'ultrasound'
  | 'ecg'
  | 'eeg'
  | 'blood_pressure'
  | 'cholesterol'
  | 'diabetes'
  | 'thyroid'
  | 'liver_function'
  | 'kidney_function'
  | 'pregnancy_test'
  | 'covid_test'
  | 'hiv_test'
  | 'hepatitis_test'
  | 'allergy_test';

export interface LabTestValues {
  [key: string]: string | number | boolean;
}

// Lab test configurations
export const LabTestConfig: Record<LabTestType, { name: string; fields: LabTestField[] }> = {
  blood_test: {
    name: 'Complete Blood Count',
    fields: [
      { name: 'wbc', label: 'White Blood Cells', unit: '10^3/μL', normalRange: '4.5-11.0' },
      { name: 'rbc', label: 'Red Blood Cells', unit: '10^6/μL', normalRange: '4.5-6.0' },
      { name: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL', normalRange: '13.5-17.5' },
      { name: 'hematocrit', label: 'Hematocrit', unit: '%', normalRange: '40-52' },
      { name: 'platelets', label: 'Platelets', unit: '10^3/μL', normalRange: '150-450' },
    ]
  },
  urinalysis: {
    name: 'Urinalysis',
    fields: [
      { name: 'color', label: 'Color', normalRange: 'Yellow' },
      { name: 'appearance', label: 'Appearance', normalRange: 'Clear' },
      { name: 'ph', label: 'pH', normalRange: '4.5-8.0' },
      { name: 'protein', label: 'Protein', normalRange: 'Negative' },
      { name: 'glucose', label: 'Glucose', normalRange: 'Negative' },
    ]
  },
  ct_scan: { name: 'CT Scan', fields: [] },
  mri: { name: 'MRI', fields: [] },
  x_ray: { name: 'X-Ray', fields: [] },
  ultrasound: { name: 'Ultrasound', fields: [] },
  ecg: { name: 'ECG', fields: [] },
  eeg: { name: 'EEG', fields: [] },
  blood_pressure: { 
    name: 'Blood Pressure', 
    fields: [
      { name: 'systolic', label: 'Systolic', unit: 'mmHg', normalRange: '90-120' },
      { name: 'diastolic', label: 'Diastolic', unit: 'mmHg', normalRange: '60-80' },
    ]
  },
  cholesterol: { 
    name: 'Cholesterol Test', 
    fields: [
      { name: 'total', label: 'Total Cholesterol', unit: 'mg/dL', normalRange: '<200' },
      { name: 'hdl', label: 'HDL', unit: 'mg/dL', normalRange: '>40' },
      { name: 'ldl', label: 'LDL', unit: 'mg/dL', normalRange: '<100' },
    ]
  },
  diabetes: { 
    name: 'Diabetes Test', 
    fields: [
      { name: 'glucose', label: 'Glucose', unit: 'mg/dL', normalRange: '70-100' },
      { name: 'hba1c', label: 'HbA1c', unit: '%', normalRange: '<5.7' },
    ]
  },
  thyroid: { 
    name: 'Thyroid Test', 
    fields: [
      { name: 'tsh', label: 'TSH', unit: 'μIU/mL', normalRange: '0.4-4.0' },
      { name: 't4', label: 'T4', unit: 'μg/dL', normalRange: '4.5-11.2' },
    ]
  },
  liver_function: { 
    name: 'Liver Function Test', 
    fields: [
      { name: 'alt', label: 'ALT', unit: 'U/L', normalRange: '7-56' },
      { name: 'ast', label: 'AST', unit: 'U/L', normalRange: '10-40' },
      { name: 'alp', label: 'ALP', unit: 'U/L', normalRange: '44-147' },
    ]
  },
  kidney_function: { 
    name: 'Kidney Function Test', 
    fields: [
      { name: 'creatinine', label: 'Creatinine', unit: 'mg/dL', normalRange: '0.6-1.2' },
      { name: 'bun', label: 'BUN', unit: 'mg/dL', normalRange: '7-20' },
    ]
  },
  pregnancy_test: { 
    name: 'Pregnancy Test', 
    fields: [
      { name: 'result', label: 'Result', normalRange: 'Negative' },
    ]
  },
  covid_test: { 
    name: 'COVID-19 Test', 
    fields: [
      { name: 'result', label: 'Result', normalRange: 'Negative' },
    ]
  },
  hiv_test: { 
    name: 'HIV Test', 
    fields: [
      { name: 'result', label: 'Result', normalRange: 'Negative' },
    ]
  },
  hepatitis_test: { 
    name: 'Hepatitis Test', 
    fields: [
      { name: 'result', label: 'Result', normalRange: 'Negative' },
    ]
  },
  allergy_test: { 
    name: 'Allergy Test', 
    fields: [
      { name: 'allergens', label: 'Reactive Allergens', normalRange: 'None' },
    ]
  },
};

export interface LabTestField {
  name: string;
  label: string;
  unit?: string;
  normalRange?: string;
}