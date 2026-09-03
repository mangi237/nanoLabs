/**
 * YeboVerify KYC & Identity Verification Service
 * Server-Side Integration with live API Key
 */

export interface KycVerificationRequest {
    verificationType: 'lab_onboarding' | 'doctor_credentialing' | 'patient_transfer' | 'national_id';
    fullName: string;
    nationalId?: string;
    licenseNumber?: string;
    orderNumber?: string;
    institutionName?: string;
    documentType?: string;
    phone?: string;
    email?: string;
  }
  
  export interface KycVerificationResponse {
    success: boolean;
    verificationId?: string;
    verified?: boolean;
    verificationType?: string;
    provider?: string;
    apiKeyMasked?: string;
    data?: {
      fullName: string;
      nationalId: string;
      licenseNumber: string;
      institutionName: string;
      documentType: string;
      confidenceScore: number;
      identityMatch: boolean;
      sanctionsCheck: string;
      verifiedAt: string;
      credentialIssuer: string;
    };
    error?: string;
  }
  
  export const kycService = {
    /**
     * Run live YeboVerify KYC check via secure server proxy
     */
    async verifyIdentity(payload: KycVerificationRequest): Promise<KycVerificationResponse> {
      try {
        const res = await fetch('/api/kyc/verify-identity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        return data;
      } catch (err: any) {
        console.error('YeboVerify client error:', err);
        return {
          success: false,
          error: err.message || 'Failed to connect to YeboVerify verification service.'
        };
      }
    }
  };
  
  export default kycService;
  