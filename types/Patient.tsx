// types/Patient.ts - UPDATED VERSION
import { Timestamp } from 'firebase/firestore';

export interface ResultFile {
  url: string;
  fileName: string;
  uploadedAt: Date | Timestamp;
  uploadedBy: string;
}

export interface LabTest {
  id?: string;
  name: string;
  description: string;
  category: string;
  samples: string[];
  price: number;
  method?: string;
  conditions?: string;
  timeToResults?: string;
  resultFile?: ResultFile;
  status: 'requested' | 'sample-collected' | 'in-progress' | 'completed' | 'cancelled';
  requestedBy?: string;
  requestedByName?: string;
  requestedDate?: Date | Timestamp;
  sampleCollectedBy?: string;
  sampleCollectedDate?: Date | Timestamp;
  sampleCollected?: boolean;
  completedDate?: Date | Timestamp;
  result?: string;
  technicianName?: string;
  patientId?: string;
  createdAt?: Date | Timestamp;
}

export type BillCategory = 
  | 'consultation' 
  | 'laboratory' 
  | 'radiology' 
  | 'surgery' 
  | 'medication' 
  | 'ward' 
  | 'emergency' 
  | 'miscellaneous'
  | 'pharmacy';

export interface Bill {
  id?: string;
  category: BillCategory;
  description: string;
  amount: number;
  status: 'pending' | 'paid' | 'refunded' | 'cancelled';
  createdBy: string;
  createdByName: string;
  createdAt: Date | Timestamp;
  approvedBy?: string;
  approvedAt?: Date | Timestamp;
  paidAt?: Date | Timestamp;
  paidBy?: string;
  notes?: string;
  patientId?: string;
  patientName?: string;
  relatedLabTestId?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    amount: number;
  }>;
}

// SIMPLIFIED STATUS - Only these 3
export type PatientStatus = 'registered' | 'admitted' | 'discharged' | 'emergency' ;
export type AdmissionStatus = 'outpatient' | 'inpatient' | 'emergency';

// Medication Prescription Interface
export interface MedicationPrescription {
  id?: string;
  medicationName: string;
  dosage: string;
  frequency: string; // e.g., "Every 6 hours", "Twice daily"
  duration: number; // Number of days
  startDate: Date | Timestamp;
  endDate: Date | Timestamp;
  instructions: string;
  prescribedBy: string;
  prescribedByName: string;
  prescribedDate: Date | Timestamp;
  status: 'active' | 'completed' | 'discontinued';
  notes?: string;
}

// Ward Assignment Interface
export interface WardAssignment {
  wardId: string;
  wardName: string;
  wardType: 'general' | 'icu' | 'pediatric' | 'maternity' | 'surgical' | 'private' | 'emergency';
  bedId: string;
  bedNumber: string;
  assignedDate: Date | Timestamp;
  dischargedDate?: Date | Timestamp;
  assignedBy: string;
  assignedByName: string;
  dailyRate: number;
  notes?: string;
}

// Doctor Referral Interface
export interface DoctorReferral {
  id?: string;
  referringDoctorId: string;
  referringDoctorName: string;
  referredToDoctorId: string;
  referredToDoctorName: string;
  referredDepartment: string;
  reason: string;
  priority: 'routine' | 'urgent' | 'emergency';
  appointmentDate: Date | Timestamp;
  appointmentTime: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date | Timestamp;
}

// UPDATED PATIENT INTERFACE
export interface Patient {
  id?: string;
  patientId: string;
  name: string;
  dateOfBirth: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address: string;
  emergencyContact: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  guardianName?: string;
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies?: string[];
  medicalConditions?: string[];
  pastMedicalHistory?: string[];
  surgicalHistory?: string[];
  familyHistory?: string;
  currentMedications?: string[];
  insuranceProvider?: string;
  insuranceId?: string;
  insuranceExpiry?: string;
  
  // Status - SIMPLIFIED
  status: PatientStatus;
  admissionStatus: AdmissionStatus;
  admissionDate?: Date | Timestamp;
  dischargeDate?: Date | Timestamp;
  
  // Ward Assignment - NEW
  currentWardAssignment?: WardAssignment;
  wardHistory?: WardAssignment[];
  
  // Staff assignments
  primaryPhysician?: string;
  primaryPhysicianName?: string;
  primaryNurse?: string;
  primaryNurseName?: string;
  
  // Profile
  profileImage?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  
  // Medical data (stored in subcollections but referenced here)
  vitals?: Vitals[];
  medications?: MedicationPrescription[];
  appointments?: Appointment[];
  clinicalNotes?: ClinicalNote[];
  labTests: LabTest[];
  bills?: Bill[];
  referrals?: DoctorReferral[];
  
  // Payment details
  paymentDetails?: {
    payerName: string;
    price: number;
    paymentStatus: 'pending' | 'paid' | 'refunded' | 'partial';
    paymentMethod: 'credit card' | 'debit card' | 'paypal' | 'cash' | 'Mobile Money' | 'insurance';
    date: Date | Timestamp; 
    insuranceName: string;
    insuranceId: string;
    amountPaid: number;
    balanceDue: number;
  }[];
  
  resultUrls?: ResultFile[];
  accessCode: string;
  outstandingBalance?: number;
  lastPaymentDate?: Date | Timestamp;
  totalAmountSpent?: number; // NEW - Track total hospital spending
  
  // PRIVACY SETTINGS - NEW
  blockedStaff?: string[]; // Array of staff IDs who cannot access
  approvedStaff?: string[]; // Array of staff IDs who are approved (for restricted mode)
  accessMode?: 'standard' | 'restricted' | 'high-privacy'; // Access control mode
}

// Clinical Note interface
export interface ClinicalNote {
  id?: string;
  patientId: string;
  authorId: string;
  authorName: string;
  noteType: 'soap' | 'progress' | 'nursing' | 'discharge' | 'consultation';
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  content: string;
  date: Date | Timestamp;
  timestamp: Date | Timestamp;
  isCritical: boolean;
  relatedLabTests?: string[];
}

// Vitals interface
export interface Vitals {
  id?: string;
  patientId: string;
  patientName: string;
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
  timestamp: Date | Timestamp;
  bloodGlucose?: string;
  painScale?: number;
  avpu?: 'alert' | 'voice' | 'pain' | 'unresponsive';
}

// Appointment interface
export interface Appointment {
  id?: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: Date | Timestamp;
  time: string;
  title: string;
  type: 'consultation' | 'follow-up' | 'procedure' | 'referral';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  location: string;
  notes?: string;
  createdAt: Date | Timestamp;
}

// Ward interface
export interface Ward {
  id?: string;
  wardNumber: string;
  wardName: string;
  wardType: 'general' | 'icu' | 'pediatric' | 'maternity' | 'surgical' | 'private' | 'emergency';
  floor: number;
  capacity: number;
  currentOccupancy: number;
  dailyRate: number;
  beds: Bed[];
  isActive: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Bed interface
export interface Bed {
  id?: string;
  bedNumber: string;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
  patientId?: string;
  patientName?: string;
  assignedDate?: Date | Timestamp;
}

// Access Log Interface
export interface AccessLog {
  id?: string;
  patientId: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  timestamp: Date | Timestamp;
  action: string;
  accessType: 'normal' | 'emergency_override';
  reason?: string; // For emergency override
  sectionsAccessed?: string[]; // Which parts of the record were viewed
  ipAddress?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  role?: string;
  code?: string;
  hospitalId: string;
}