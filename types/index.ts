export interface ReferringDoctor {
  id: string;
  labId: string;
  name: string;
  specialty?: string;
  hospital?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  notes?: string;
  totalReferrals?: number;
  totalTestsDone?: number;
  totalRevenueGenerated?: number;
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export type RoleType = 'admin' | 'receptionist' | 'cashier' | 'analyzer' | 'lab_tech' | 'biologist' | 'patient' | 'matron' | 'doctor' | 'nurse' | 'pharmacy' | 'lab' | 'superadmin' | 'inventory_manager';

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
  patientCount?: number;
  totalTestsDone?: number;
  accessCode?: string;
  status?: 'active' | 'pending' | 'suspended';
  createdAt?: string;
  updatedAt?: string;
}
