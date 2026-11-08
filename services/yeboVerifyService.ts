import { apiJson } from './apiClient';
export interface YeboVerificationResult {
    verified: boolean;
    referenceId: string;
    verificationType: 'lab_accreditation' | 'patient_id' | 'doctor_license' | 'record_transfer';
    status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'MANUAL_REVIEW';
    holderName: string;
    documentNumber: string;
    issuer?: string;
    timestamp: string;
    confidenceScore: number;
    verificationBadge: string;
    details?: Record<string, any>;
  }
  

async function verify(payload: any): Promise<YeboVerificationResult> {
  const result = await apiJson('/api/kyc/verify-identity', payload);
  if (result.verified !== true || result.status !== 'APPROVED') throw new Error('Identity verification was not approved.');
  return { verified: true, referenceId: result.referenceId, verificationType: 'patient_id', status: 'APPROVED', holderName: payload.fullName, documentNumber: payload.nationalId ?? payload.licenseNumber ?? '', timestamp: new Date().toISOString(), confidenceScore: 0, verificationBadge: 'Provider approved' };
}
export const yeboVerifyService = {
  verifyPatientRecordTransfer: async (_params: any): Promise<YeboVerificationResult> => { throw new Error('Record transfer verification is unavailable. No transfer was approved.'); },
  verifyLabFacility: (params: any) => verify({ verificationType: 'lab_onboarding', fullName: params.labName, ...(params.licenseNumber ? { licenseNumber: params.licenseNumber } : {}) }),
  verifyPatientIdentity: (params: any) => verify({ verificationType: 'national_id', fullName: params.fullName, nationalId: params.nationalIdOrPassport }),
  verifyDoctorLicense: (params: any) => verify({ verificationType: 'doctor_credentialing', fullName: params.fullName ?? params.doctorName, licenseNumber: params.licenseNumber })
};
export default yeboVerifyService;
