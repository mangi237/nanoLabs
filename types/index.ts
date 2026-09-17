// Canonical Enums
export type AccountType = 'patient' | 'doctor' | 'lab_staff' | 'superadmin';

export type SampleMode = 'walk_in' | 'home_collection';

export type BatchStatus = 
  | 'intake' 
  | 'collected' 
  | 'in_transit' 
  | 'received' 
  | 'analysis' 
  | 'validation' 
  | 'signed' 
  | 'ready';

export type PaymentStatus = 'pending' | 'verified' | 'rejected';

export type PaymentMethod = 'cash' | 'mtn_momo' | 'orange_money';

export type ConsultationType = 'video' | 'in_person' | 'waspito';

// Master Test & Catalog
export interface Test {
  id: string;
  code: string;
  name: string;
  frenchName?: string;
  category: 'hematology' | 'biochemistry' | 'parasitology' | 'microbiology' | 'serology' | 'hormones' | 'toxicology' | 'other';
  sampleType: string;
  turnaroundTimeHours: number;
  fastingRequirement: string;
  basePrice: number;
  bCode?: string;
  description?: string;
  referenceRanges?: {
    male?: string;
    female?: string;
    pediatric?: string;
    unit?: string;
  };
}

export interface MasterTestCatalog {
  version: string;
  lastUpdated: string;
  tests: Test[];
}

// Test Batch Item
export interface BatchTestItem {
  testId: string;
  code: string;
  name: string;
  category: string;
  sampleType: string;
  basePrice: number;
  resultValue?: string;
  referenceRange?: string;
  unit?: string;
  flag?: 'normal' | 'low' | 'high' | 'critical';
  status: 'pending' | 'in_analysis' | 'validated';
}

// Canonical TestBatch
export interface TestBatch {
  id: string;
  batchNumber: string;
  patientId: string;
  patientName: string;
  familyProfileId?: string;
  familyRelationship?: string;
  patientPhone?: string;
  patientAge?: number;
  patientGender?: string;
  labId: string;
  labName: string;
  sampleMode: SampleMode;
  status: BatchStatus;
  tests: BatchTestItem[];
  recommendingDoctorId?: string;
  recommendingDoctorName?: string;
  sampleTubeBarcode?: string;
  collectedAt?: string;
  receivedAt?: string;
  signedAt?: string;
  biologistName?: string;
  biologistLicense?: string;
  qrAuditHash?: string;
  reportUrl?: string;
  invoiceId?: string;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Financial Invoices
export interface InvoiceLine {
  id: string;
  testId: string;
  testCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  batchId: string;
  batchNumber?: string;
  patientId: string;
  patientName: string;
  familyProfileId?: string;
  beneficiaryName?: string;
  policyHolderName?: string;
  patientPhone?: string;
  labId: string;
  labName: string;
  lines?: InvoiceLine[];
  items?: Array<{ testId: string; code: string; name: string; price: number }>;
  subtotal?: number;
  homeCollectionFee?: number;
  grossTotal: number;
  // Insurance split
  insuranceProviderName?: string;
  insurancePolicyNumber?: string;
  insuranceCoveragePercent: number;
  insuranceCoveredAmount: number;
  patientShare: number;
  // Platform fee on patient share only
  platformFeePercent: number; // 5
  platformFeeAmount: number; // 5% of patientShare
  // Final patient amount due at cashier
  totalPatientDue: number; // patientShare + platformFeeAmount
  tvaRatePercent?: number; // 0 (exempt)
  tvaExemptAmount?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentVerifiedAt?: string;
  verifiedByCashierName?: string;
  transactionRef?: string;
  payerPhone?: string;
  payerName?: string;
  createdAt: string;
}

export interface PaymentConfirmation {
  invoiceId: string;
  batchId: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  cashierId: string;
  cashierName: string;
  accessCodeVerified: boolean;
  verifiedAt: string;
}

// Monthly Lab Settlement for Super Admin
export interface LabSettlement {
  id: string;
  settlementMonth: string; // "2026-09"
  monthYear?: string;
  labId: string;
  labName: string;
  totalBatches: number;
  totalTestsCount?: number;
  grossRevenue: number;
  grossTestsRevenue?: number;
  totalInsuranceBilled: number;
  totalPatientCollected: number;
  totalPatientShareRevenue?: number;
  totalPlatformFeeOwed: number; // 5% on patient share
  platformFeeTotalDue?: number;
  settlementStatus: 'pending' | 'invoiced' | 'settled' | 'paid';
  settledAt?: string;
  paidAt?: string;
  settledBy?: string;
  paymentReceiptRef?: string;
  paymentTransactionRef?: string;
}

export type MonthlySettlementRecord = LabSettlement;

// Immutable Hash-Chained Audit Logs
export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  eventType?: string;
  index?: number;
  targetType: 'batch' | 'invoice' | 'report' | 'patient' | 'system';
  targetId: string;
  details: Record<string, any>;
  metadata?: Record<string, any>;
  previousHash: string;
  hash: string;
  entryHash?: string;
}

export type AuditLogEntry = AuditLog;

export interface PatientActivityLog {
  id: string;
  patientId: string;
  timestamp: string;
  title: string;
  description: string;
  actionType: 'login' | 'booking_created' | 'sample_collected' | 'analysis_started' | 'report_signed' | 'report_shared' | 'payment_verified';
  relatedBatchId?: string;
}

// Live Phlebotomist Transit
export interface TransitSession {
  id: string;
  batchId: string;
  batchNumber?: string;
  status?: string;
  tubeBarcodeScanned?: string;
  phlebotomistId: string;
  phlebotomistName: string;
  phlebotomistPhone: string;
  patientAddress?: string;
  patientLat?: number;
  patientLng?: number;
  currentLat?: number;
  currentLng?: number;
  currentLocation?: { lat: number; lng: number };
  targetLocation?: { lat: number; lng: number };
  etaMinutes: number;
  coldChainTemperatureCelsius: number;
  isActive?: boolean;
  lastPingAt: string;
  startedAt?: string;
  completedAt?: string;
}

// CEMAC Health Insurers
export interface InsuranceProvider {
  id: string;
  code: string;
  name: string;
  fullName: string;
  coverageTiers: { tier: string; defaultPercent: number }[];
  requiresPriorAuthorization: boolean;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
}

// Doctor Referral & Collaboration
export interface ReferralLedger {
  id: string;
  doctorId: string;
  doctorName: string;
  batchId: string;
  patientId: string;
  patientName: string;
  labId: string;
  labName: string;
  testCodes: string[];
  referralDate: string;
  status: 'pending' | 'completed';
  notes?: string;
}

export interface ConnectionRequest {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty?: string;
  initiatedBy: 'patient' | 'doctor';
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface ReferringDoctor {
  id: string;
  labId: string;
  doctorId?: string;
  name: string;
  specialty?: string;
  hospital?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  profilePicture?: string;
  licenseNumber?: string;
  notes?: string;
  invitationStatus?: 'accepted' | 'pending' | 'declined';
  origin?: 'admin_invitation' | 'patient_referral' | 'accredited_network' | 'manual';
  invitedAt?: string;
  acceptedAt?: string;
  totalReferrals?: number;
  totalTestsDone?: number;
  totalRevenueGenerated?: number;
  status?: 'active' | 'inactive' | 'pending';
  createdAt?: string;
  updatedAt?: string;
}

export type RoleType = 'admin' | 'receptionist' | 'cashier' | 'analyzer' | 'lab_tech' | 'biologist' | 'patient' | 'matron' | 'doctor' | 'nurse' | 'pharmacy' | 'lab' | 'superadmin' | 'super_admin' | 'lab_staff' | 'phlebotomist' | 'technician' | 'lab_admin' | 'inventory_manager';
export type UserRole = RoleType;

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role?: RoleType;
  primaryRole?: RoleType;
  roles?: RoleType[];
  accessCode?: string;
  labId?: string;
  labName?: string;
  avatarUrl?: string;
  profilePicture?: string;
  nationalId?: string;
  age?: number;
  dateOfBirth?: string;
  referringDoctorId?: string;
  referringDoctor?: string;
  referralHospital?: string;
  referralNotes?: string;
  isStaffMember?: boolean;
  staffDesignation?: string;
  bloodGroup?: string;
  hasInsurance?: boolean;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceCardUrl?: string;
  mustChangePassword?: boolean;
  status?: string;
}

export type PricingModelType = 'pay_per_test' | 'flat_subscription' | 'lifetime_space';
export type SubscriptionTierType = 'small' | 'medium' | 'large' | 'starter' | 'growth' | 'business' | 'enterprise';

export interface Lab {
  id: string;
  name: string;
  location: string;
  city?: string;
  slogan?: string;
  tagline?: string;
  motto?: string;
  address?: string;
  phone?: string;
  contactNumber?: string;
  email?: string;
  contactEmail?: string;
  website?: string;
  websiteUrl?: string;
  licenseNumber?: string;
  taxId?: string;
  currency?: string;
  currencySymbol?: string;
  directorName?: string;
  directorPhone?: string;
  description?: string;
  patientCount?: number;
  confirmedTestsCount?: number;
  totalTestsCount?: number;
  royaltyEarnings?: number;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  avatarUrl?: string;
  feePerTest?: number;
  feePerPatient?: number;
  pricingModel?: PricingModelType;
  subscriptionPlan?: PricingModelType;
  subscriptionTier?: SubscriptionTierType;
  subscriptionPrice?: number;
  subscriptionStartDate?: string;
  billingPeriod?: 'monthly' | 'annual';
  monthlyMaintenanceFee?: number;
  staffLimit?: number;
  patientLimit?: number;
  sitesCount?: number;
  collectionCentresCount?: number;
  verificationStatus?: 'verified' | 'trial_active' | 'pending';
  verificationToken?: string;
  verifiedAt?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  status?: 'active' | 'pending_approval' | 'suspended' | 'rejected';
  confirmed?: boolean;
  confirmedAt?: string;
  confirmedBy?: string;
  requestedPricingModel?: PricingModelType;
  requestedSubscriptionTier?: SubscriptionTierType;
  planChangeRequestedAt?: string;
  isCustomSelected?: boolean;
  createdAt?: string;
}

export interface Hospital {
  id: string;
  name: string;
  slogan?: string;
  location?: string;
}

export interface LabTest {
  id: string;
  name?: string;
  testName?: string;
  category?: string;
  price?: number;
  basePrice?: number;
  systemFee?: number;
  priceDisplay?: string;
  method?: string;
  conditions?: string;
  sampleType?: string;
  description?: string;
  turnaroundTime?: string;
  expectedTime?: string;
  status?: 'requested' | 'confirmed' | 'collected' | 'sample-collected' | 'processing' | 'completed' | 'paid';
  paymentStatus?: 'paid' | 'pending';
  paid?: boolean;
  receptionistValidated?: boolean;
  confirmedByReceptionist?: boolean;
  confirmedAt?: string;
  confirmedBy?: string;
  patientId?: string;
  patientName?: string;
  requestedDate?: string;
  appointmentTime?: string;
  completedDate?: string;
  result?: string;
  pdfUrl?: string;
  fileUrl?: string;
  virtualRequested?: boolean;
  virtualRequestedAt?: string;
  sampleCollected?: boolean;
  sampleCollectedBy?: string;
  sampleCollectedByName?: string;
  sampleCollectedDate?: any;
  samples?: string[];
  doctorName?: string;
  doctorRole?: string;
  labTechId?: string;
  labTechName?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Patient {
  id: string;
  patientId?: string;
  name: string;
  age?: number;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  nationalId?: string;
  bloodGroup?: string;
  hasInsurance?: boolean;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceCoveragePercent?: number;
  insuranceCoveredAmount?: number;
  patientCoPayAmount?: number;
  insuranceCardUrl?: string;
  avatarUrl?: string;
  profilePicture?: string;
  accessCode?: string;
  isWalkIn?: boolean;
  registrationType?: 'online' | 'walk_in';
  emergencyContact?: string;
  doctorName?: string;
  referringDoctorId?: string;
  referringDoctor?: string;
  referralHospital?: string;
  referralNotes?: string;
  labId?: string;
  labName?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  healthDataConsent?: boolean;
  status?: 'active' | 'pending' | 'inactive' | 'lab-pending' | 'lab-sample-collected' | 'pending_confirmation';
  labTests?: LabTest[];
  updatedAt?: string;
  createdAt?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  supplier?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface Bill {
  id: string;
  description: string;
  amount: number;
  category?: string;
  status: 'paid' | 'pending';
  patientName?: string;
  createdAt?: string;
}

export interface Appointment {
  id: string;
  title: string;
  testId?: string;
  testName?: string;
  price?: number;
  turnaroundTime?: string;
  date?: string;
  time?: string;
  duration?: string;
  doctorName?: string;
  labTechId?: string;
  labTechName?: string;
  location?: string;
  notes?: string;
  type?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'pending';
  patientId?: string;
  patientName?: string;
  createdAt?: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  patientId?: string;
  patientName?: string;
}

export interface PatientBooking {
  id: string;
  bookingCode?: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  patientAge?: number;
  patientGender?: string;
  labId?: string;
  labName?: string;
  tests?: any[];
  totalAmount?: number;
  totalPrice?: number;
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
  sampleCollected?: boolean;
  sampleCollectedAt?: string;
  resultsReady?: boolean;
  resultsReleased?: boolean;
  biologistConfirmed?: boolean;
  biologistConfirmedAt?: string;
  biologistName?: string;
  referringDoctorId?: string;
  referringDoctor?: string;
  referralHospital?: string;
  referralNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty?: string;
  licenseNumber?: string;
  hospitalAffiliation?: string;
  hospital?: string;
  avatarUrl?: string;
  profilePicture?: string;
  patientCount?: number;
  totalTestsDone?: number;
  accessCode?: string;
  status?: 'active' | 'pending' | 'suspended';
  createdAt?: string;
  updatedAt?: string;
}

// Multi-Profile Family & Dependent Account Types
export type FamilyRelationship = 
  | 'self'
  | 'mother'
  | 'father'
  | 'child'
  | 'daughter'
  | 'son'
  | 'spouse'
  | 'sibling'
  | 'grandparent'
  | 'other';

export interface FamilyMemberProfile {
  id: string;
  primaryAccountId: string;
  fullName: string;
  relationship: FamilyRelationship;
  relationshipLabel: string;
  dateOfBirth?: string;
  age: number;
  gender: 'female' | 'male' | 'other';
  bloodGroup?: string;
  nationalId?: string;
  allergies?: string[];
  chronicConditions?: string[];
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceCoveragePercent?: number;
  isDependentOnPrimaryInsurance?: boolean;
  notes?: string;
  createdAt: string;
  avatarColor?: string;
}

