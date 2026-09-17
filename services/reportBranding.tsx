/**
 * Laboratory Report Branding Configuration
 * STRICT RULE: Reports are strictly branded with the performing laboratory's letterhead,
 * accreditation numbers, dynamic medical biologist name & ONMC registration.
 */

export interface LabBrandingConfig {
    labId: string;
    labName: string;
    headerLogoUrl?: string;
    tagline?: string;
    accreditationNumber?: string;
    minsanteApprovalCode?: string;
    physicalAddress: string;
    phone: string;
    email: string;
    primaryColorHex: string;
    secondaryColorHex: string;
    footerDisclaimerText: string;
    defaultSignatoryName: string;
    defaultSignatoryTitle: string;
    defaultSignatoryOnmcLicense: string;
    signatureStampUrl?: string;
  }
  
  const BRANDING_STORAGE_KEY = 'nanolabs_lab_branding_configs';
  
  export const DEFAULT_BRANDINGS: Record<string, LabBrandingConfig> = {
    lab_central_douala: {
      labId: 'lab_central_douala',
      labName: 'Laboratoire Central Akwa - Douala',
      tagline: 'Centre d’Analyses Médicales de Référence & Diagnostic Spécialisé',
      accreditationNumber: 'ISO 15189 / MINSANTE-CAM-0942',
      minsanteApprovalCode: 'MINSANTE/DPML/2022/410',
      physicalAddress: '142 Boulevard de la Liberté, Akwa, Douala, Cameroun',
      phone: '+237 677 82 91 04 / +237 699 12 40 88',
      email: 'contact@labocentral-akwa.cm',
      primaryColorHex: '#0F766E',
      secondaryColorHex: '#14B8A6',
      footerDisclaimerText: 'Examen de biologie médicale réalisé sous le contrôle strict de la réglementation pharmaceutique et biologique du Cameroun. Toute reproduction partielle est formellement interdite.',
      defaultSignatoryName: 'Dr. Suzanne Mbongo',
      defaultSignatoryTitle: 'Pharmacienne-Biologiste Directrice',
      defaultSignatoryOnmcLicense: 'ONMC #4829 / ONPC #1204'
    },
    lab_pasteur_yaounde: {
      labId: 'lab_pasteur_yaounde',
      labName: 'Centre Diagnostic Bonanjo & Pasteur Yaoundé',
      tagline: 'Laboratoire de Biologie Médicale & d’Anatomie Pathologique',
      accreditationNumber: 'MINSANTE-CAM-0781',
      minsanteApprovalCode: 'MINSANTE/DPML/2021/189',
      physicalAddress: 'Avenue Kennedy, Quartier du Lac, Yaoundé, Cameroun',
      phone: '+237 655 40 11 22',
      email: 'direction@diagnostic-bonanjo.cm',
      primaryColorHex: '#0D3B38',
      secondaryColorHex: '#0F766E',
      footerDisclaimerText: 'Résultats validés électroniquement conformément à l’arrêté ministériel régissant les laboratoires d’analyses médicales.',
      defaultSignatoryName: 'Pr. Alain Tchamda',
      defaultSignatoryTitle: 'Médecin Biologiste Spécialiste',
      defaultSignatoryOnmcLicense: 'ONMC #2910'
    }
  };
  
  export function getLabBranding(labId: string): LabBrandingConfig {
    try {
      const raw = localStorage.getItem(BRANDING_STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw);
        if (stored[labId]) return stored[labId];
      }
    } catch (e) {
      // fallback
    }
  
    return (
      DEFAULT_BRANDINGS[labId] || {
        labId,
        labName: 'Laboratoire Biomédical Partenaire',
        tagline: 'Analyses Médicales Certifiées & Biologie Clinique',
        accreditationNumber: 'MINSANTE Homologué',
        minsanteApprovalCode: 'MINSANTE/LBM',
        physicalAddress: 'République du Cameroun',
        phone: '+237 670 00 00 00',
        email: 'lab@nanolabs.cm',
        primaryColorHex: '#0F766E',
        secondaryColorHex: '#14B8A6',
        footerDisclaimerText: 'Résultats validés par le biologiste médical responsable.',
        defaultSignatoryName: 'Dr. Biologiste Médical',
        defaultSignatoryTitle: 'Biologiste de Garde',
        defaultSignatoryOnmcLicense: 'ONMC #0000'
      }
    );
  }
  
  export function saveLabBranding(config: LabBrandingConfig): void {
    try {
      const raw = localStorage.getItem(BRANDING_STORAGE_KEY);
      const stored = raw ? JSON.parse(raw) : {};
      stored[config.labId] = config;
      localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(stored));
    } catch (e) {
      console.error('Failed to save lab branding', e);
    }
  }
  