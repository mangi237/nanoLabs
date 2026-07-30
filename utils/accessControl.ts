// utils/accessControl.ts
import { doc, updateDoc, collection, addDoc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Patient, AccessLog } from '../types/Patient';

interface AccessCheckResult {
  allowed: boolean;
  requiresEmergencyOverride: boolean;
  requiresApproval: boolean;
  reason?: string;
}

interface StaffUser {
  id: string;
  name: string;
  role: string;
  hospitalId: string;
}

/**
 * Check if a staff member can access a patient's records
 */
export const checkAccess = async (
  patientId: string,
  hospitalId: string,
  staffUser: StaffUser
): Promise<AccessCheckResult> => {
  try {
    // Fetch patient privacy settings
    const patientRef = doc(db, 'hospitals', hospitalId, 'patients', patientId);
    const patientSnap = await getDoc(patientRef);

    if (!patientSnap.exists()) {
      return {
        allowed: false,
        requiresEmergencyOverride: false,
        requiresApproval: false,
        reason: 'Patient not found'
      };
    }

    const patient = patientSnap.data() as Patient;
    const blockedStaff = patient.blockedStaff || [];
    const approvedStaff = patient.approvedStaff || [];
    const accessMode = patient.accessMode || 'standard';

    // Check if staff is blocked
    if (blockedStaff.includes(staffUser.id)) {
      return {
        allowed: false,
        requiresEmergencyOverride: true,
        requiresApproval: false,
        reason: 'Access blocked by patient'
      };
    }

    // Check access mode
    switch (accessMode) {
      case 'standard':
        // Role-based access - allow with audit
        return {
          allowed: true,
          requiresEmergencyOverride: false,
          requiresApproval: false
        };

      case 'restricted':
        // Only approved staff can access
        if (approvedStaff.includes(staffUser.id)) {
          return {
            allowed: true,
            requiresEmergencyOverride: false,
            requiresApproval: false
          };
        } else {
          return {
            allowed: false,
            requiresEmergencyOverride: true,
            requiresApproval: false,
            reason: 'Not in approved staff list'
          };
        }

      case 'high-privacy':
        // Requires approval for each access
        return {
          allowed: false,
          requiresEmergencyOverride: false,
          requiresApproval: true,
          reason: 'Patient approval required'
        };

      default:
        return {
          allowed: true,
          requiresEmergencyOverride: false,
          requiresApproval: false
        };
    }
  } catch (error) {
    console.error('Error checking access:', error);
    return {
      allowed: false,
      requiresEmergencyOverride: false,
      requiresApproval: false,
      reason: 'Error checking access permissions'
    };
  }
};

/**
 * Log access to patient records
 */
export const logAccess = async (
  patientId: string,
  hospitalId: string,
  staffUser: StaffUser,
  action: string,
  accessType: 'normal' | 'emergency_override' = 'normal',
  sectionsAccessed?: string[],
  emergencyReason?: string
): Promise<void> => {
  try {
    const accessLog: Omit<AccessLog, 'id'> = {
      patientId,
      staffId: staffUser.id,
      staffName: staffUser.name,
      staffRole: staffUser.role,
      timestamp: Timestamp.now(),
      action,
      accessType,
      sectionsAccessed,
      reason: emergencyReason
    };

    await addDoc(
      collection(db, 'hospitals', hospitalId, 'patients', patientId, 'accessLog'),
      accessLog
    );

    console.log('Access logged:', accessLog);
  } catch (error) {
    console.error('Error logging access:', error);
  }
};

/**
 * Handle emergency override access
 */
export const requestEmergencyOverride = async (
  patientId: string,
  hospitalId: string,
  staffUser: StaffUser,
  reason: string
): Promise<boolean> => {
  try {
    // Log the emergency override
    await logAccess(
      patientId,
      hospitalId,
      staffUser,
      'Emergency Override Access',
      'emergency_override',
      ['all'],
      reason
    );

    // Flag for compliance review
    await addDoc(
      collection(db, 'hospitals', hospitalId, 'complianceReviews'),
      {
        type: 'emergency_override',
        patientId,
        staffId: staffUser.id,
        staffName: staffUser.name,
        reason,
        timestamp: Timestamp.now(),
        status: 'pending_review',
        reviewedBy: null,
        reviewedAt: null
      }
    );

    return true;
  } catch (error) {
    console.error('Error requesting emergency override:', error);
    return false;
  }
};

/**
 * Get role-based permissions
 */
export const getRolePermissions = (role: string) => {
  const permissions = {
    admin: {
      canViewAllPatients: true,
      canRecordVitals: true,
      canPrescribeMedication: true,
      canAddConsultationNotes: true,
      canAddBills: true,
      canAddLabTests: true,
      canValidatePayment: true,
      canUpdateStatus: true,
      canAddAppointments: true,
      canReferPatient: true,
      canAdmitPatient: true,
      canDischargePatient: true,
      canManageWards: true,
      canViewFullMedicalHistory: true,
      canViewBilling: true,
      canViewLabResults: true,
    },
    doctor: {
      canViewAllPatients: true,
      canRecordVitals: true,
      canPrescribeMedication: true,
      canAddConsultationNotes: true,
      canAddBills: false,
      canAddLabTests: true,
      canValidatePayment: false,
      canUpdateStatus: true,
      canAddAppointments: true,
      canReferPatient: true,
      canAdmitPatient: true,
      canDischargePatient: true,
      canManageWards: false,
      canViewFullMedicalHistory: true,
      canViewBilling: true,
      canViewLabResults: true,
    },
    nurse: {
      canViewAllPatients: true,
      canRecordVitals: true,
      canPrescribeMedication: false,
      canAddConsultationNotes: true,
      canAddBills: false,
      canAddLabTests: false,
      canValidatePayment: false,
      canUpdateStatus: true,
      canAddAppointments: true,
      canReferPatient: false,
      canAdmitPatient: false,
      canDischargePatient: false,
      canManageWards: false,
      canViewFullMedicalHistory: true,
      canViewBilling: false,
      canViewLabResults: true,
    },
    matron: {
      canViewAllPatients: true,
      canRecordVitals: true,
      canPrescribeMedication: false,
      canAddConsultationNotes: true,
      canAddBills: false,
      canAddLabTests: false,
      canValidatePayment: false,
      canUpdateStatus: true,
      canAddAppointments: true,
      canReferPatient: false,
      canAdmitPatient: false,
      canDischargePatient: false,
      canManageWards: true,
      canViewFullMedicalHistory: true,
      canViewBilling: false,
      canViewLabResults: true,
    },
    ward: {
      canViewAllPatients: true,
      canRecordVitals: true,
      canPrescribeMedication: false,
      canAddConsultationNotes: true,
      canAddBills: false,
      canAddLabTests: false,
      canValidatePayment: false,
      canUpdateStatus: true,
      canAddAppointments: false,
      canReferPatient: false,
      canAdmitPatient: false,
      canDischargePatient: false,
      canManageWards: true,
      canViewFullMedicalHistory: false,
      canViewBilling: false,
      canViewLabResults: false,
    },
    receptionist: {
      canViewAllPatients: true,
      canRecordVitals: false,
      canPrescribeMedication: false,
      canAddConsultationNotes: false,
      canAddBills: true,
      canAddLabTests: false,
      canValidatePayment: false,
      canUpdateStatus: true,
      canAddAppointments: true,
      canReferPatient: false,
      canAdmitPatient: false,
      canDischargePatient: false,
      canManageWards: false,
      canViewFullMedicalHistory: false,
      canViewBilling: true,
      canViewLabResults: false,
    },
    cashier: {
      canViewAllPatients: true,
      canRecordVitals: false,
      canPrescribeMedication: false,
      canAddConsultationNotes: false,
      canAddBills: true,
      canAddLabTests: false,
      canValidatePayment: true,
      canUpdateStatus: false,
      canAddAppointments: false,
      canReferPatient: false,
      canAdmitPatient: false,
      canDischargePatient: false,
      canManageWards: false,
      canViewFullMedicalHistory: false,
      canViewBilling: true,
      canViewLabResults: false,
    },
    analyzer: {
      canViewAllPatients: true,
      canRecordVitals: false,
      canPrescribeMedication: false,
      canAddConsultationNotes: false,
      canAddBills: false,
      canAddLabTests: true,
      canValidatePayment: false,
      canUpdateStatus: false,
      canAddAppointments: false,
      canReferPatient: false,
      canAdmitPatient: false,
      canDischargePatient: false,
      canManageWards: false,
      canViewFullMedicalHistory: false,
      canViewBilling: false,
      canViewLabResults: true,
    },
    lab: {
      canViewAllPatients: true,
      canRecordVitals: false,
      canPrescribeMedication: false,
      canAddConsultationNotes: false,
      canAddBills: false,
      canAddLabTests: true,
      canValidatePayment: false,
      canUpdateStatus: false,
      canAddAppointments: false,
      canReferPatient: false,
      canAdmitPatient: false,
      canDischargePatient: false,
      canManageWards: false,
      canViewFullMedicalHistory: false,
      canViewBilling: false,
      canViewLabResults: true,
    },
    radiology: {
      canViewAllPatients: true,
      canRecordVitals: true,
      canPrescribeMedication: false,
      canAddConsultationNotes: true,
      canAddBills: true,
      canAddLabTests: true,
      canValidatePayment: false,
      canUpdateStatus: true,
      canAddAppointments: true,
      canReferPatient: false,
      canAdmitPatient: false,
      canDischargePatient: false,
      canManageWards: false,
      canViewFullMedicalHistory: false,
      canViewBilling: true,
      canViewLabResults: true,
    },
    surgeon: {
      canViewAllPatients: true,
      canRecordVitals: true,
      canPrescribeMedication: true,
      canAddConsultationNotes: true,
      canAddBills: true,
      canAddLabTests: true,
      canValidatePayment: false,
      canUpdateStatus: true,
      canAddAppointments: true,
      canReferPatient: true,
      canAdmitPatient: true,
      canDischargePatient: true,
      canManageWards: false,
      canViewFullMedicalHistory: true,
      canViewBilling: true,
      canViewLabResults: true,
    },
    emergency: {
      canViewAllPatients: true,
      canRecordVitals: true,
      canPrescribeMedication: true,
      canAddConsultationNotes: true,
      canAddBills: false,
      canAddLabTests: true,
      canValidatePayment: false,
      canUpdateStatus: true,
      canAddAppointments: false,
      canReferPatient: true,
      canAdmitPatient: true,
      canDischargePatient: false,
      canManageWards: false,
      canViewFullMedicalHistory: true,
      canViewBilling: false,
      canViewLabResults: true,
    },
  };

  return permissions[role] || permissions.receptionist; // Default to receptionist if role not found
};

/**
 * Filter patient data based on role permissions
 */
export const filterPatientDataByRole = (patient: Patient, role: string): Partial<Patient> => {
  const permissions = getRolePermissions(role);

  const filteredData: any = {
    id: patient.id,
    patientId: patient.patientId,
    name: patient.name,
    age: patient.age,
    gender: patient.gender,
    phone: patient.phone,
    status: patient.status,
    admissionStatus: patient.admissionStatus,
  };

  if (permissions.canViewFullMedicalHistory) {
    filteredData.allergies = patient.allergies;
    filteredData.medicalConditions = patient.medicalConditions;
    filteredData.pastMedicalHistory = patient.pastMedicalHistory;
    filteredData.surgicalHistory = patient.surgicalHistory;
    filteredData.familyHistory = patient.familyHistory;
    filteredData.currentMedications = patient.currentMedications;
    filteredData.vitals = patient.vitals;
    filteredData.clinicalNotes = patient.clinicalNotes;
    filteredData.medications = patient.medications;
  }

  if (permissions.canViewBilling) {
    filteredData.bills = patient.bills;
    filteredData.outstandingBalance = patient.outstandingBalance;
    filteredData.totalAmountSpent = patient.totalAmountSpent;
    filteredData.paymentDetails = patient.paymentDetails;
  }

  if (permissions.canViewLabResults) {
    filteredData.labTests = patient.labTests;
    filteredData.resultUrls = patient.resultUrls;
  }

  return filteredData;
};