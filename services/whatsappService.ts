// services/whatsappService.ts
import { Linking, Alert } from 'react-native';

export interface WhatsAppMessage {
  to: string;
  message: string;
  deepLink?: string;
}

class WhatsAppService {
  private static instance: WhatsAppService;
  private baseUrl = 'https://wa.me/';

  static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  async sendMessage({ to, message, deepLink }: WhatsAppMessage): Promise<boolean> {
    try {
      // Format phone number
      const phoneNumber = this.formatPhoneNumber(to);
      
      // Build message with deep link
      let fullMessage = message;
      if (deepLink) {
        fullMessage += `\n\n🔗 ${deepLink}`;
      }

      const encodedMessage = encodeURIComponent(fullMessage);
      const url = `${this.baseUrl}${phoneNumber}?text=${encodedMessage}`;

      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      } else {
        // Fallback to web
        const webUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;
        await Linking.openURL(webUrl);
        return true;
      }
    } catch (error) {
      console.error('WhatsApp error:', error);
      return false;
    }
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('237') && cleaned.length === 9) {
      cleaned = `237${cleaned}`;
    }
    return cleaned;
  }

  generateDeepLink(patientId: string, testId: string, labId: string): string {
    return `nanolabs://patient/${labId}/${patientId}/test/${testId}`;
  }

  async sendResultReadyNotification(
    patientPhone: string,
    patientName: string,
    patientId: string,
    testId: string,
    labId: string,
    labName: string,
    language: 'en' | 'fr' = 'en'
  ): Promise<boolean> {
    const deepLink = this.generateDeepLink(patientId, testId, labId);
    
    const messages = {
      en: `🔬 Hello ${patientName}!\n\nYour test results from ${labName} are now ready.\n\nClick the link below to view your results:\n${deepLink}\n\nThank you for choosing ${labName}! 🏥`,
      fr: `🔬 Bonjour ${patientName}!\n\nVos résultats de test de ${labName} sont maintenant disponibles.\n\nCliquez sur le lien ci-dessous pour voir vos résultats:\n${deepLink}\n\nMerci d'avoir choisi ${labName}! 🏥`
    };

    return this.sendMessage({
      to: patientPhone,
      message: messages[language] || messages.en,
      deepLink
    });
  }

  async sendPaymentConfirmation(
    patientPhone: string,
    patientName: string,
    amount: number,
    testName: string,
    labName: string,
    language: 'en' | 'fr' = 'en'
  ): Promise<boolean> {
    const messages = {
      en: `💰 Payment Confirmed!\n\nHello ${patientName},\n\nYour payment of ${amount} FCFA for ${testName} at ${labName} has been confirmed.\n\nThank you for choosing ${labName}! 🏥`,
      fr: `💰 Paiement Confirmé!\n\nBonjour ${patientName},\n\nVotre paiement de ${amount} FCFA pour ${testName} à ${labName} a été confirmé.\n\nMerci d'avoir choisi ${labName}! 🏥`
    };

    return this.sendMessage({
      to: patientPhone,
      message: messages[language] || messages.en
    });
  }

  async sendNewTestRequest(
    patientPhone: string,
    patientName: string,
    testName: string,
    labName: string,
    language: 'en' | 'fr' = 'en'
  ): Promise<boolean> {
    const messages = {
      en: `🧪 New Test Requested!\n\nHello ${patientName},\n\nA new test (${testName}) has been requested for you at ${labName}.\n\nPlease log in to your dashboard for more details.\n\nThank you for choosing ${labName}! 🏥`,
      fr: `🧪 Nouveau Test Demandé!\n\nBonjour ${patientName},\n\nUn nouveau test (${testName}) a été demandé pour vous à ${labName}.\n\nVeuillez vous connecter à votre tableau de bord pour plus de détails.\n\nMerci d'avoir choisi ${labName}! 🏥`
    };

    return this.sendMessage({
      to: patientPhone,
      message: messages[language] || messages.en
    });
  }
}

export default WhatsAppService.getInstance();