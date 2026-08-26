// src/services/emailService.ts
// Backend-driven Email and Cryptographic OTP Service with Dynamic HTML templates (Resend, SendGrid, & Server API)

export interface OtpSendResult {
  success: boolean;
  verificationId?: string;
  expiresAt?: string;
  provider?: string;
  message?: string;
  debugCode?: string;
  error?: string;
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

/**
 * Sends a 6-digit cryptographic verification code to an email address via backend API.
 * Used for:
 * 1. Lab creation human verification (anti-bot / ownership proof)
 * 2. Patient sharing diagnostic results with their doctor
 * 3. Staff onboarding & authentication
 */
export const sendOtpVerification = async (
  email: string,
  type: 'lab_creation' | 'patient_share' | 'staff_invite' | 'general' = 'general',
  recipientName?: string,
  labName?: string,
  metadata?: any
): Promise<OtpSendResult> => {
  try {
    const res = await fetch('/api/email/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        type,
        recipientName,
        labName,
        metadata
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Failed to dispatch verification code'
      };
    }

    return {
      success: true,
      verificationId: data.verificationId,
      expiresAt: data.expiresAt,
      provider: data.provider,
      message: data.message,
      debugCode: data.debugCode
    };
  } catch (error: any) {
    console.error('Error dispatching OTP verification code:', error);
    return {
      success: false,
      error: error.message || 'Network error connecting to email subsystem'
    };
  }
};

/**
 * Verifies the 6-digit OTP code against the server's cryptographic hash store.
 */
export const verifyOtpCode = async (
  email: string,
  code: string,
  verificationId?: string
): Promise<OtpVerifyResult> => {
  try {
    const res = await fetch('/api/email/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        code: code.trim(),
        verificationId
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success || !data.verified) {
      return {
        success: false,
        verified: false,
        error: data.error || 'Invalid or expired verification code'
      };
    }

    return {
      success: true,
      verified: true,
      verificationId: data.verificationId,
      email: data.email,
      reason: data.reason
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

/**
 * Sends official diagnostic lab results directly to a physician's inbox via backend mailer.
 */
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
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Failed to deliver report to doctor email'
      };
    }

    return {
      success: true,
      message: data.message,
      provider: data.provider
    };
  } catch (error: any) {
    console.error('Error sending doctor report email:', error);
    return {
      success: false,
      error: error.message || 'Network error dispatching doctor email'
    };
  }
};

/**
 * Generic notification email dispatcher
 */
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

export const sendResultNotificationEmail = async (
  email: string,
  patientName: string,
  testName: string,
  result: string
) => {
  return sendEmail(
    email,
    `Your ${testName} Results are Ready - nanoLabs`,
    `Dear ${patientName},\n\nYour ${testName} results are now available.\n\nResult: ${result}\n\nPlease log in to your patient dashboard to review your official diagnostic reports.\n\nThank you for choosing nanoLabs Diagnostics!`,
    {
      patient_name: patientName,
      test_name: testName,
      result: result
    }
  );
};

export default {
  sendOtpVerification,
  verifyOtpCode,
  sendDoctorReportEmail,
  sendEmail,
  sendResultNotificationEmail
};
