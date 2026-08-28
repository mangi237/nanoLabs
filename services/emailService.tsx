// src/services/emailService.ts
export interface OtpSendResult {
  success: boolean;
  verificationId?: string;
  expiresAt?: string;
  provider?: string;
  message?: string;
  error?: string;
  debugCode?: string;
}

export interface OtpVerifyResult {
  success: boolean;
  verified?: boolean;
  verificationId?: string;
  email?: string;
  reason?: string;
  error?: string;
}

export interface DoctorReportEmailPayload {
  doctorEmail: string;
  doctorName?: string;
  patientName: string;
  patientAge?: number | string;
  patientGender?: string;
  patientPhone?: string;
  patientCode?: string;
  labName: string;
  labContact?: string;
  bookingCode: string;
  tests: Array<{
    testName: string;
    category?: string;
    resultValue?: string;
    unit?: string;
    referenceRange?: string;
    status?: string;
    subParameters?: Array<{ name: string; value: string; unit?: string; referenceRange?: string; status?: string }>;
  }>;
  reportUrl?: string;
  remarks?: string;
  biologistName?: string;
}

export const sendOtpVerification = async (
  email: string,
  type: 'lab_creation' | 'patient_share' | 'staff_invite' | 'general' = 'general',
  recipientName?: string,
  labName?: string,
  metadata?: any
): Promise<OtpSendResult> => {
  const cleanEmail = email.trim().toLowerCase();

  try {
    const res = await fetch('/api/email/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        type,
        recipientName,
        labName,
        metadata
      })
    });

    const data = await res.json();

    if (data && data.success) {
      return {
        success: true,
        verificationId: data.verificationId,
        expiresAt: data.expiresAt,
        provider: data.provider || 'Internal Mail Dispatcher',
        message: data.message || `Verification code sent to ${cleanEmail}`
        // NO debugCode returned
      };
    }

    return {
      success: false,
      error: data?.error || 'Failed to send verification code'
    };
  } catch (error: any) {
    console.error('Error dispatching OTP verification code:', error);
    return {
      success: false,
      error: error.message || 'Network error sending verification code'
    };
  }
};

export const verifyOtpCode = async (
  email: string,
  code: string,
  verificationId?: string
): Promise<OtpVerifyResult> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  try {
    const res = await fetch('/api/email/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        code: cleanCode,
        verificationId
      })
    });

    const data = await res.json();

    if (data && data.success && data.verified) {
      return {
        success: true,
        verified: true,
        verificationId: data.verificationId || verificationId,
        email: data.email || cleanEmail,
        reason: data.reason
      };
    }

    return {
      success: false,
      verified: false,
      error: data?.error || 'Invalid or expired verification code. Please check your 6-digit code.'
    };
  } catch (error: any) {
    console.error('Error verifying OTP code:', error);
    return {
      success: false,
      verified: false,
      error: error.message || 'Network error verifying code'
    };
  }
};

export const sendDoctorReportEmail = async (
  payload: DoctorReportEmailPayload
): Promise<{ success: boolean; message?: string; provider?: string; error?: string }> => {
  try {
    const res = await fetch('/api/email/send-doctor-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    
    return {
      success: data.success || false,
      message: data.message,
      provider: data.provider,
      error: data.error
    };
  } catch (error: any) {
    console.error('Error sending doctor report email:', error);
    return {
      success: false,
      error: error.message || 'Network error dispatching doctor email'
    };
  }
};

export const sendLabWelcomeEmail = async (params: {
  labName: string;
  adminName: string;
  adminEmail: string;
  accessCode: string;
  phone?: string;
  address?: string;
  location?: string;
  website?: string;
  licenseNumber?: string;
  taxId?: string;
  pricingModel?: string;
  tier?: string;
}): Promise<{ success: boolean; message?: string; provider?: string; error?: string }> => {
  try {
    const res = await fetch('/api/email/send-lab-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const data = await res.json();
    return data;
  } catch (error: any) {
    console.error('Error sending lab welcome email:', error);
    return {
      success: false,
      error: error.message || 'Network error dispatching welcome email'
    };
  }
};

export const sendEmail = async (
  to: string,
  subject: string,
  message: string,
  extraParams: Record<string, any> = {}
) => {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        toName: extraParams.to_name || extraParams.patient_name || to.split('@')[0],
        subject,
        message,
        labName: extraParams.lab_name || 'nanoLabs Diagnostics',
        ...extraParams
      })
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('❌ Email dispatch error:', error);
    return { success: false, error: error?.message || 'Network error sending email' };
  }
};


export const debugCode =  {


 
}

export default {
  sendOtpVerification,
  verifyOtpCode,
  sendDoctorReportEmail,
  sendLabWelcomeEmail,
  sendEmail,
  debugCode
};