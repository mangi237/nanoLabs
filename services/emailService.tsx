// src/services/emailService.ts

const getEnvVar = (key: string, fallback: string) => {
  try {
    const metaEnv = (import.meta as any).env || {};
    const procEnv = typeof process !== 'undefined' ? process.env : {};
    return metaEnv[key] || procEnv[key] || fallback;
  } catch {
    return fallback;
  }
};

export const SERVICE_ID = getEnvVar('VITE_EMAILJS_SERVICE_ID', 'service_u03r0wb');
export const TEMPLATE_ID = getEnvVar('VITE_EMAILJS_TEMPLATE_ID', 'template_flqjy5n');
export const USER_ID = getEnvVar('VITE_EMAILJS_PUBLIC_KEY', 'xLCmdo_YqdRM8UjZP');

export const sendEmail = async (
  to: string,
  subject: string,
  message: string,
  extraParams: Record<string, any> = {}
) => {
  try {
    console.log('📧 Preparing to send live email via EmailJS:', {
      serviceId: SERVICE_ID,
      templateId: TEMPLATE_ID,
      userId: USER_ID,
      to,
      subject,
      message
    });

    // Populate standard EmailJS template variable aliases so all template configurations work
    const templateParams = {
      to_email: to,
      to_name: to.split('@')[0] || 'Patient',
      recipient_email: to,
      user_email: to,
      email: to,
      to: to,
      subject: subject,
      message: message,
      from_name: 'nanoLabs Diagnostics',
      reply_to: 'support@nanolabs.health',
      ...extraParams,
    };

    if (SERVICE_ID && TEMPLATE_ID && USER_ID) {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: SERVICE_ID,
          template_id: TEMPLATE_ID,
          user_id: USER_ID,
          template_params: templateParams,
        }),
      });

      if (response.ok) {
        const textResp = await response.text();
        console.log('✅ Email successfully delivered via EmailJS API:', textResp);
        return { success: true, response: textResp };
      } else {
        const errorText = await response.text();
        console.warn('⚠️ EmailJS API returned error response:', response.status, errorText);
        return {
          success: false,
          status: response.status,
          error: errorText || `EmailJS returned HTTP ${response.status}`
        };
      }
    }

    return {
      success: true,
      simulated: true,
      message: `Notification email dispatched to ${to}`
    };
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
  sendEmail,
  sendResultNotificationEmail
};

