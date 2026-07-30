export interface Vital {
  id?: string;
  patientId: string;
  temperature: string;
  bloodPressure: string;
  heartRate: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  height: string;
  weight: string;
  bmi: string;
  notes: string;
  date: string;
  recordedBy: string;
  timestamp: Date;
}