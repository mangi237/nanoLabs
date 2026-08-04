// // services/emailService.ts
// import emailjs from '@emailjs/react-native';

// const SERVICE_ID = 'your_service_id';
// const TEMPLATE_ID = 'your_template_id';
// const USER_ID = 'your_user_id';

// export const sendEmail = async (to: string, subject: string, message: string) => {
//   try {
//     const templateParams = {
//       to_email: to,
//       subject: subject,
//       message: message,
//       from_name: 'nanoLabs',
//     };

//     const response = await emailjs.send(
//       SERVICE_ID,
//       TEMPLATE_ID,
//       templateParams,
//       USER_ID
//     );
    
//     return { success: true, response };
//   } catch (error) {
//     console.error('Email error:', error);
//     return { success: false, error };
//   }
// };

// export const sendResultNotificationEmail = async (
//   email: string,
//   patientName: string,
//   testName: string,
//   result: string
// ) => {
//   return sendEmail(
//     email,
//     `Your ${testName} Results are Ready`,
//     `Dear ${patientName},\n\nYour ${testName} results are now available.\n\nResult: ${result}\n\nPlease log in to your dashboard for more details.\n\nThank you for choosing nanoLabs!`
//   );
// };