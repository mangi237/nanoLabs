// utils/whatsappGateway.ts
// Zero-friction WhatsApp Bridge & Magic Action Links for Cameroon Partner Labs (No App / No LIMS install needed)

export interface WhatsAppOrderDispatchParams {
  bookingCode: string;
  patientName: string;
  patientPhone?: string;
  patientAlias?: string;
  tests: Array<{ name: string; price?: number }>;
  totalAmount?: number;
  homeCollection?: boolean;
  pickupLocation?: string;
  userCoords?: { lat: number; lng: number };
  labName: string;
  labPhone?: string;
  accessKey?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceCoveragePercent?: number;
  patientCoPayPercent?: number;
  referringDoctor?: string;
  prescriberPromoCode?: string;
}

/**
 * Builds the direct, single-tap WhatsApp wa.me URL for the laboratory receptionist or manager.
 * It contains a complete pre-formatted, professional diagnostic order ticket with the instant action link!
 */
export function buildLabWhatsAppOrderUrl(params: WhatsAppOrderDispatchParams): {
  waUrl: string;
  actionUrl: string;
  messageText: string;
  cleanPhone: string;
} {
  const origin = typeof window !== 'undefined' && window.location.origin 
    ? window.location.origin 
    : 'https://ais-dev-hgzprkc74y3imig6led45o-559681012735.europe-west2.run.app';

  const actionUrl = `${origin}/?partnerOrder=${encodeURIComponent(params.bookingCode)}${
    params.accessKey ? `&key=${encodeURIComponent(params.accessKey)}` : ''
  }`;

  const testsList = params.tests.map((t) => `• ${t.name}`).join('\n');
  const collectionType = params.homeCollection
    ? `🏠 Prélèvement à domicile (GPS: ${params.pickupLocation || 'Localisé'})`
    : `🏥 Prélèvement sur place au laboratoire`;

  const mapLink = params.userCoords?.lat && params.userCoords?.lng
    ? `\n📍 Position GPS: https://maps.google.com/?q=${params.userCoords.lat},${params.userCoords.lng}`
    : '';

  const insuranceSection = params.insuranceProvider && params.insurancePolicyNumber
    ? `\n🛡️ *Assurance (Tiers-Payant):* ${params.insuranceProvider}\n   • Matricule / Police: ${params.insurancePolicyNumber}\n   • Taux Couverture: ${params.insuranceCoveragePercent ?? 80}%\n   • Ticket Modérateur Patient à encaisser: ${params.patientCoPayPercent ?? (100 - (params.insuranceCoveragePercent ?? 80))}%`
    : `\n💵 *Règlement:* 100% Comptant / Espèces au guichet du labo (Sans assurance)`;

  const prescriberSection = params.referringDoctor && params.referringDoctor !== 'Self-Referred'
    ? `\n🩺 *Prescripteur:* ${params.referringDoctor}${params.prescriberPromoCode ? ` (Code: ${params.prescriberPromoCode})` : ''}`
    : '';

  const messageText = `🧪 *NOUVELLE DEMANDE D'EXAMEN - nanoLabs*
━━━━━━━━━━━━━━━━━━━━
Bonjour *${params.labName}*,

Vous avez reçu une nouvelle commande d'analyses médicales :

📋 *Commande #:* ${params.bookingCode}
👤 *Patient:* ${params.patientName}${params.patientAlias ? ` (@${params.patientAlias})` : ''}
📞 *Tél Patient:* ${params.patientPhone || 'Non renseigné'}
🩺 *Modalité:* ${collectionType}${mapLink}${prescriberSection}
${insuranceSection}

🔬 *Analyses demandées :*
${testsList}

━━━━━━━━━━━━━━━━━━━━
⚡ *TRAITEMENT DIRECT (SANS APPLICATION) :*
Cliquez ci-dessous pour confirmer, fixer votre devis/facture, ou déposer le résultat :
👉 ${actionUrl}
━━━━━━━━━━━━━━━━━━━━
_nanoLabs Diagnostic Gateway & Care Network Cameroon_`;

  // Clean lab phone to standard WhatsApp international format (237XXXXXXXXX)
  let cleanPhone = String(params.labPhone || '').replace(/\D/g, '');
  if (cleanPhone.length === 9) {
    cleanPhone = `237${cleanPhone}`;
  } else if (cleanPhone.startsWith('00237')) {
    cleanPhone = cleanPhone.slice(2);
  } else if (!cleanPhone.startsWith('237') && cleanPhone.length > 0) {
    cleanPhone = `237${cleanPhone}`;
  }

  const waUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`
    : `https://wa.me/?text=${encodeURIComponent(messageText)}`;

  return {
    waUrl,
    actionUrl,
    messageText,
    cleanPhone,
  };
}

/**
 * Builds direct WhatsApp share link for patient to send to their laboratory or phlebotomist
 */
export function buildPatientToLabWhatsAppShareUrl(
  bookingCode: string,
  labName: string,
  labPhone?: string,
  testsSummary?: string
): string {
  const origin = typeof window !== 'undefined' && window.location.origin 
    ? window.location.origin 
    : 'https://ais-dev-hgzprkc74y3imig6led45o-559681012735.europe-west2.run.app';

  const actionUrl = `${origin}/?partnerOrder=${encodeURIComponent(bookingCode)}`;

  const text = `Bonjour *${labName}*, voici ma demande de test nanoLabs *#${bookingCode}* (${testsSummary || 'Examens de laboratoire'}). Veuillez ouvrir ce lien pour voir mes examens et me transmettre ma facture : ${actionUrl}`;

  let cleanPhone = String(labPhone || '').replace(/\D/g, '');
  if (cleanPhone.length === 9) cleanPhone = `237${cleanPhone}`;

  return cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
}
