// services/emailService.ts
import { Alert } from 'react-native';

// EmailJS Configuration - Replace with your actual credentials
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_zjlxy2x', // Replace with your EmailJS Service ID
  TEMPLATE_ID: 'hospital_update_template', // We'll use a default template name
  USER_ID: 'gTiUtFIwwHMJYEIeY', // Replace with your EmailJS Public Key
};

// Main email sending function
export const sendPatientUpdateEmail = async (
  patientEmail: string, 
  patientName: string, 
  updateType: string, 
  details: string
): Promise<boolean> => {
  try {
    // Validate credentials
    if (!EMAILJS_CONFIG.SERVICE_ID || !EMAILJS_CONFIG.USER_ID) {
      console.warn('EmailJS credentials not configured');
      return false;
    }

    const templateParams = {
      to_email: patientEmail,
      patient_name: patientName,
      update_type: updateType,
      update_details: details,
      hospital_name: 'Hospital Manager',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
    };

    console.log('Sending email with params:', templateParams);

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_CONFIG.SERVICE_ID,
        template_id: EMAILJS_CONFIG.TEMPLATE_ID,
        user_id: EMAILJS_CONFIG.USER_ID,
        template_params: templateParams,
      }),
    });

    const result = await response.text();
    console.log('EmailJS Response:', response.status, result);

    if (response.ok) {
      console.log('✅ Email sent successfully to:', patientEmail);
      return true;
    } else {
      console.error('❌ EmailJS error:', response.status, result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};

// Fallback email service using a simple HTTP endpoint
export const sendFallbackEmail = async (
  patientEmail: string,
  patientName: string,
  updateType: string,
  details: string
): Promise<boolean> => {
  try {
    // This is a backup method - you can use any email service here
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_key: 'YOUR_WEB3FORMS_ACCESS_KEY', // Optional backup
        subject: `Hospital Update: ${updateType}`,
        from_name: 'Hospital Manager',
        patient_name: patientName,
        patient_email: patientEmail,
        update_type: updateType,
        update_details: details,
        date: new Date().toLocaleString(),
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Fallback email error:', error);
    return false;
  }
};

// Main function that tries both services
export const sendUpdateNotification = async (
  patientEmail: string,
  patientName: string,
  updateType: string,
  details: string
): Promise<void> => {
  if (!patientEmail) {
    console.log('No patient email provided, skipping notification');
    return;
  }

  console.log(`📧 Attempting to send ${updateType} notification to:`, patientEmail);

  // Try EmailJS first
  const emailJSSuccess = await sendPatientUpdateEmail(patientEmail, patientName, updateType, details);
  
  if (!emailJSSuccess) {
    console.log('Trying fallback email service...');
    // Try fallback if EmailJS fails
    await sendFallbackEmail(patientEmail, patientName, updateType, details);
  }
};

// Initialize EmailJS with your credentials
export const initializeEmailJS = (serviceId: string, publicKey: string) => {
  EMAILJS_CONFIG.SERVICE_ID = serviceId;
  EMAILJS_CONFIG.USER_ID = publicKey;
  console.log('EmailJS initialized with Service ID:', serviceId);
};