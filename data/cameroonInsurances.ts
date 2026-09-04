import { number } from "motion/react";

export interface CameroonInsuranceCompany {
  id: string;
  name: string;
  shortName: string;
  city: string;
  phone?: string;
  supportEmail?: string;
  email?: string;
  code?: string;
  logoColor?: string;
  category?: string;
  status?: 'active' | 'suspended' | 'inactive';
  requiresBpcNumber?: boolean;
  requiresDossierNumber?: boolean;
  requiresMatricule?: boolean;
  defaultRateB?: number; // Base biological coefficient monetary value in XAF (e.g., 260)
  defaultRateKB?: number; // Sampling / Prelevement coefficient monetary value in XAF (e.g., 1200)
  defaultRateP?: number; // Pathology/Cytology coefficient monetary value in XAF (e.g., 300)
  defaultRateK?: number; // Clinical surgical coefficient in XAF (e.g., 1500)
  baseRateB?: number;
  baseRateKB?: number;
  baseRateP?: number;
  baseRateK?: number;
  acceptedSampleActs?: string[];
  defaultCoveragePercent?: number; // Default Taux Assu (e.g. 80)
  defaultPatientCopayPercent?: number; // Default Ticket Moderateur (e.g. 20)
  taxId?: string; // N.I.U. (Numéro d'Identifiant Unique)
  rcNumber?: string; // Registre de Commerce
  bp?: string; // Boîte Postale
  address?: string;
}

export const CAMEROON_INSURANCE_COMPANIES: CameroonInsuranceCompany[] = [
  {
    id: 'ascoma',
    name: 'ASCOMA Cameroun (Douala & Yaoundé)',
    shortName: 'ASCOMA',
    city: 'Douala / Yaoundé',
    code: 'ASC-CMR',
    phone: '+237 233 42 13 00',
    supportEmail: 'contact.cameroun@ascoma.com',
    logoColor: '#0F766E',
    defaultRateB: 260,
    defaultRateKB: 1200,
    defaultRateP: 300,
    defaultRateK: 1500,
    defaultCoveragePercent: 80,
    taxId: 'M019800000000A',
    address: 'Rue Ivy, Bonanjo, B.P. 444 Douala'
  },
  {
    id: 'gmc',
    name: 'GMC Assurances / Gras Savoye (Willis Towers Watson)',
    shortName: 'GMC Gras Savoye',
    city: 'Douala / Yaoundé',
    code: 'GMC-CMR',
    phone: '+237 233 42 77 00',
    supportEmail: 'sante.cameroun@grassavoye.com',
    logoColor: '#1E3A8A',
    defaultRateB: 260,
    defaultRateKB: 1200,
    defaultRateP: 300,
    defaultRateK: 1500,
    defaultCoveragePercent: 80,
    taxId: 'M038500000000Z',
    address: 'Boulevard de la Liberté, Akwa Douala'
  },
  {
    id: 'activa',
    name: 'Activa Assurances (Douala & Yaoundé)',
    shortName: 'Activa Assurances',
    city: 'Douala',
    code: 'ACT-DLA',
    phone: '+237 233 43 01 00',
    supportEmail: 'contact@group-activa.com',
    logoColor: '#0055A5',
    defaultRateB: 260,
    defaultRateKB: 1200,
    defaultRateP: 300,
    defaultRateK: 1500,
    defaultCoveragePercent: 80,
    taxId: 'M029800001234B',
    address: 'Rue Prince Bell, Bonanjo Douala'
  },
  {
    id: 'axa',
    name: 'AXA Assurances Cameroun (Douala)',
    shortName: 'AXA Cameroun',
    city: 'Douala',
    code: 'AXA-CMR',
    phone: '+237 233 42 88 00',
    supportEmail: 'service.client@axa.cm',
    logoColor: '#00008F',
    defaultRateB: 280,
    defaultRateKB: 1250,
    defaultRateP: 320,
    defaultRateK: 1600,
    defaultCoveragePercent: 80,
    taxId: 'M018700009876C',
    address: 'Place du Gouvernement, Bonanjo Douala'
  },
  {
    id: 'saar',
    name: 'SAAR Assurances S.A. (Yaoundé / Douala)',
    shortName: 'SAAR Assurances',
    city: 'Yaoundé / Douala',
    code: 'SAAR-SA',
    phone: '+237 222 20 28 88',
    supportEmail: 'saar@saar-assurances.com',
    logoColor: '#7C3AED',
    defaultRateB: 260,
    defaultRateKB: 1200,
    defaultRateP: 300,
    defaultRateK: 1500,
    defaultCoveragePercent: 80,
    taxId: 'M049000005432D',
    address: 'Immeuble SAAR, Avenue Monseigneur Vogt, Yaoundé'
  },
  {
    id: 'chanas',
    name: 'Chanas Assurances (Douala)',
    shortName: 'Chanas Assurances',
    city: 'Douala',
    code: 'CHA-DLA',
    phone: '+237 233 42 24 38',
    supportEmail: 'contact@chanas-assurances.com',
    logoColor: '#D97706',
    defaultRateB: 260,
    defaultRateKB: 1200,
    defaultRateP: 300,
    defaultRateK: 1500,
    defaultCoveragePercent: 80,
    taxId: 'M059900003322E',
    address: 'Boulevard de la République, Douala'
  },
  {
    id: 'sanlam',
    name: 'Sanlam Allianz Cameroun (Douala & Yaoundé)',
    shortName: 'Sanlam Allianz',
    city: 'Douala',
    code: 'SAN-CMR',
    phone: '+237 233 42 01 40',
    supportEmail: 'contact.cameroun@sanlamallianz.com',
    logoColor: '#0284C7',
    defaultRateB: 260,
    defaultRateKB: 1200,
    defaultRateP: 300,
    defaultRateK: 1500,
    defaultCoveragePercent: 80,
    taxId: 'M068400007788F',
    address: 'Rue de la Motte Piquet, Bonanjo Douala'
  },
  {
    id: 'sunu',
    name: 'SUNU Assurances (Douala)',
    shortName: 'SUNU Assurances',
    city: 'Douala',
    code: 'SUNU-DLA',
    phone: '+237 233 42 12 40',
    supportEmail: 'cameroun.assurances@sunu-group.com',
    logoColor: '#DC2626',
    defaultRateB: 250,
    defaultRateKB: 1100,
    defaultRateP: 290,
    defaultRateK: 1400,
    defaultCoveragePercent: 80,
    taxId: 'M078900004455G',
    address: 'Avenue du Général de Gaulle, Bonanjo Douala'
  },
  {
    id: 'nsia',
    name: 'NSIA Assurances (Douala)',
    shortName: 'NSIA Assurances',
    city: 'Douala',
    code: 'NSIA-CMR',
    phone: '+237 233 42 34 50',
    supportEmail: 'nsiaassurancescmr@groupensia.com',
    logoColor: '#16A34A',
    defaultRateB: 260,
    defaultRateKB: 1200,
    defaultRateP: 300,
    defaultRateK: 1500,
    defaultCoveragePercent: 80,
    taxId: 'M089200008899H',
    address: 'Immeuble NSIA, Rue Joss, Bonanjo Douala'
  },
  {
    id: 'prudential',
    name: 'Prudential Beneficial Life Insurance (Douala)',
    shortName: 'Prudential Beneficial',
    city: 'Douala',
    code: 'PRU-BEN',
    phone: '+237 233 42 55 10',
    supportEmail: 'service@beneficial.cm',
    logoColor: '#EA580C',
    defaultRateB: 260,
    defaultRateKB: 1200,
    defaultRateP: 300,
    defaultRateK: 1500,
    defaultCoveragePercent: 80,
    taxId: 'M099500002233I',
    address: 'Avenue de Gaulle, Bonanjo Douala'
  },
  {
    id: 'agc',
    name: 'Assurances Générales du Cameroun - AGC (Douala)',
    shortName: 'AGC Assurances',
    city: 'Douala',
    code: 'AGC-DLA',
    phone: '+237 233 42 82 82',
    supportEmail: 'agc@agc-cameroun.com',
    logoColor: '#0D9488',
    defaultRateB: 250,
    defaultRateKB: 1200,
    defaultRateP: 300,
    defaultRateK: 1400,
    defaultCoveragePercent: 70,
    taxId: 'M109300001144J',
    address: 'Rue Sylvani, Akwa Douala'
  },
  {
    id: 'zenithe',
    name: 'Zenithe Insurance (Douala)',
    shortName: 'Zenithe Insurance',
    city: 'Douala',
    code: 'ZEN-DLA',
    phone: '+237 233 43 11 00',
    supportEmail: 'info@zenitheinsurance.com',
    logoColor: '#059669',
    defaultRateB: 260,
    defaultRateKB: 1200,
    defaultRateP: 300,
    defaultRateK: 1500,
    defaultCoveragePercent: 80,
    taxId: 'M119700006677K',
    address: 'Rue Castelnau, Douala'
  },
  {
    id: 'area',
    name: 'Area Assurances (Douala)',
    shortName: 'Area Assurances',
    city: 'Douala',
    code: 'AREA-DLA',
    phone: '+237 233 42 80 50',
    supportEmail: 'contact@area-assurances.com',
    logoColor: '#9333EA',
    defaultRateB: 250,
    defaultRateKB: 1150,
    defaultRateP: 290,
    defaultRateK: 1450,
    defaultCoveragePercent: 80,
    taxId: 'M129900004411L',
    address: 'Boulevard de la Liberté, Akwa Douala'
  },
  {
    id: 'proassur',
    name: 'Pro-Assur S.A. (Douala)',
    shortName: 'Pro-Assur',
    city: 'Douala',
    code: 'PRO-DLA',
    phone: '+237 233 42 16 00',
    supportEmail: 'info@proassur.com',
    logoColor: '#2563EB',
    defaultRateB: 260,
    defaultRateKB: 1200,
    defaultRateP: 300,
    defaultRateK: 1500,
    defaultCoveragePercent: 80,
    taxId: 'M139600007722M',
    address: 'Rue Druroux, Akwa Douala'
  },
  {
    id: 'cpa',
    name: 'CPA (Compagnie Professionnelle d\'Assurances)',
    shortName: 'CPA Assurances',
    city: 'Douala',
    code: 'CPA-DLA',
    phone: '+237 233 42 90 00',
    supportEmail: 'contact@cpa-assurances.cm',
    logoColor: '#0891B2',
    defaultRateB: 250,
    defaultRateKB: 1100,
    defaultRateP: 280,
    defaultRateK: 1400,
    defaultCoveragePercent: 80,
    taxId: 'M149100009933N',
    address: 'Boulevard Ahmadou Ahidjo, Douala'
  },
  {
    id: 'cnps',
    name: 'CNPS (Caisse Nationale de Prévoyance Sociale)',
    shortName: 'CNPS Santé',
    city: 'Yaoundé / National',
    code: 'CNPS-CMR',
    phone: '+237 222 23 40 11',
    supportEmail: 'contact@cnps.cm',
    logoColor: '#15803D',
    defaultRateB: 200,
    defaultRateKB: 1000,
    defaultRateP: 250,
    defaultRateK: 1200,
    defaultCoveragePercent: 80,
    taxId: 'M000000000001P',
    address: 'Place de l\'Indépendance, Yaoundé'
  }
];

export interface CameroonCommercialBank {
  id: string;
  name: string;
  shortName: string;
  code: string;
  swiftCode?: string;
  color?: string;
}

export const CAMEROON_COMMERCIAL_BANKS: CameroonCommercialBank[] = [
  { id: 'afriland', name: 'Afriland First Bank', shortName: 'Afriland First Bank', code: 'AFR-CMR', swiftCode: 'AFRICMCA', color: '#166534' },
  { id: 'uba', name: 'United Bank for Africa (UBA Cameroun)', shortName: 'UBA Cameroon', code: 'UBA-CMR', swiftCode: 'UNAFCMCX', color: '#DC2626' },
  { id: 'sgc', name: 'Société Générale Cameroun (SGC)', shortName: 'Société Générale', code: 'SGC-CMR', swiftCode: 'SOGECMCX', color: '#E11D48' },
  { id: 'bicec', name: 'Banque Internationale du Cameroun (BICEC)', shortName: 'BICEC', code: 'BICEC-CMR', swiftCode: 'BCECCMCX', color: '#2563EB' },
  { id: 'cbc', name: 'Commercial Bank of Cameroon (CBC)', shortName: 'CBC Bank', code: 'CBC-CMR', swiftCode: 'CBCCCMAA', color: '#D97706' },
  { id: 'ecobank', name: 'Ecobank Cameroun', shortName: 'Ecobank', code: 'ECO-CMR', swiftCode: 'ECOCCMCX', color: '#0284C7' },
  { id: 'scb', name: 'SCB Cameroun (Attijariwafa Bank)', shortName: 'SCB Cameroun', code: 'SCB-CMR', swiftCode: 'SCBLCMCX', color: '#7C3AED' },
  { id: 'cca', name: 'CCA-Bank (Crédit Communautaire d\'Afrique)', shortName: 'CCA-Bank', code: 'CCA-CMR', swiftCode: 'CCABCMCX', color: '#0D9488' },
  { id: 'nfc', name: 'National Financial Credit Bank (NFC Bank)', shortName: 'NFC Bank', code: 'NFC-CMR', swiftCode: 'NFCBCMCX', color: '#4F46E5' },
  { id: 'bgfibank', name: 'BGFIBank Cameroun', shortName: 'BGFIBank', code: 'BGFI-CMR', swiftCode: 'BGFICMCX', color: '#059669' },
  { id: 'standard_chartered', name: 'Standard Chartered Bank Cameroon', shortName: 'Standard Chartered', code: 'SCB-INT', swiftCode: 'SCBLCM2X', color: '#0284C7' },
  { id: 'bacm', name: 'Banque Atlantique Cameroun (BACM)', shortName: 'Banque Atlantique', code: 'BACM-CMR', swiftCode: 'BCATCMCX', color: '#EA580C' }
];

/**
 * Calculates age accurately from Date of Birth string (YYYY-MM-DD)
 */
export function calculateAgeFromDOB(dobString?: string): number | undefined {
  if (!dobString) return undefined;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return undefined;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
}

/**
 * Format DOB display string
 */
export function formatDOBDisplay(dobString?: string): string {
  if (!dobString) return 'Not Specified';
  try {
    const d = new Date(dobString);
    if (isNaN(d.getTime())) return dobString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dobString;
  }
}

/**
 * Standard Cameroon Biological Act Nomenclature item
 */
export interface CameroonBillingNomenclature {
  code: string;
  designation: string;
  cote: string; // e.g., 'B 10', 'B 30', 'B 45', 'B 95', 'KB 1,0', 'KB 1,5'
  defaultCoefType: 'B' | 'KB' | 'P' | 'K' | 'FIXED';
  coefMultiplier: number;
  category: string;
}

export const CAMEROON_BILLING_ACTS: CameroonBillingNomenclature[] = [
  // Prélèvements & Ancillary Acts
  { code: 'PK#', designation: 'ACTE DE PRELEVEMENT DE SELLES / URINES', cote: 'KB 1,0', defaultCoefType: 'KB', coefMultiplier: 1.0, category: 'Prélèvements' },
  { code: 'PSE#', designation: 'ACTE DE PRELEVEMENT DE SANG ES', cote: 'KB 1,5', defaultCoefType: 'KB', coefMultiplier: 1.5, category: 'Prélèvements' },
  { code: 'PFV#', designation: 'ACTE DE PRELEVEMENT VAGINAL / URETRAL', cote: 'KB 1,5', defaultCoefType: 'KB', coefMultiplier: 1.5, category: 'Prélèvements' },
  
  // Official Invoice Sample Laboratory Acts
  { code: 'CREATS#', designation: 'CREATININEMIE SANGUINE & CLAIRANCE', cote: 'B 20', defaultCoefType: 'B', coefMultiplier: 20, category: 'Biochimie' },
  { code: 'EPS#', designation: 'EXAMEN PARASITOLOGIQUE DES SELLES (EPS)', cote: 'B 20', defaultCoefType: 'B', coefMultiplier: 20, category: 'Parasitologie' },
  { code: 'GLYP#', designation: 'GLYCEMIE PLASMATIQUE A JEUN', cote: 'B 15', defaultCoefType: 'B', coefMultiplier: 15, category: 'Biochimie' },
  { code: 'IONOC#', designation: 'IONOGRAMME COMPLET SANGUIN (NA, K, CL)', cote: 'B 40', defaultCoefType: 'B', coefMultiplier: 40, category: 'Biochimie' },
  { code: 'NFSH#', designation: 'NUMERATION FORMULE SANGUINE (NFS/CBC/HEMOGRAMME)', cote: 'B 35', defaultCoefType: 'B', coefMultiplier: 35, category: 'Hématologie' },
  { code: 'TRANSA#', designation: 'TRANSAMINASES HEPATIQUES (SGOT + SGPT / ASAT + ALAT)', cote: 'B 30', defaultCoefType: 'B', coefMultiplier: 30, category: 'Biochimie' },
  { code: 'UREE#', designation: 'UREE SANGUINE PLASMATIQUE', cote: 'B 15', defaultCoefType: 'B', coefMultiplier: 15, category: 'Biochimie' },
  
  // Additional Cameroon Nomenclature Codes
  { code: '0204', designation: 'COPROLOGIE / EXAMEN PARASITOLOGIQUE DES SELLES', cote: 'B 20', defaultCoefType: 'B', coefMultiplier: 20, category: 'Parasitologie' },
  { code: '0205', designation: 'SCOTCH TEST DE GRAHAM', cote: 'B 10', defaultCoefType: 'B', coefMultiplier: 10, category: 'Parasitologie' },
  { code: '0101', designation: 'NUMERATION FORMULE SANGUINE (NFS / CBC)', cote: 'B 35', defaultCoefType: 'B', coefMultiplier: 35, category: 'Hématologie' },
  { code: '0102', designation: 'GOUTTE EPAISSE & FROTTIS SANGUIN (GE/FS)', cote: 'B 10', defaultCoefType: 'B', coefMultiplier: 10, category: 'Parasitologie' },
  { code: '0105', designation: 'VITESSE DE SEDIMENTATION (VS / ESR)', cote: 'B 10', defaultCoefType: 'B', coefMultiplier: 10, category: 'Hématologie' },
  { code: '0301', designation: 'GLYCEMIE A JEUN', cote: 'B 15', defaultCoefType: 'B', coefMultiplier: 15, category: 'Biochimie' },
  { code: '0302', designation: 'CREATININEMIE + CLAIRANCE', cote: 'B 20', defaultCoefType: 'B', coefMultiplier: 20, category: 'Biochimie' },
  { code: '0303', designation: 'UREE SANGUINE', cote: 'B 15', defaultCoefType: 'B', coefMultiplier: 15, category: 'Biochimie' },
  { code: '0304', designation: 'BILAN LIPIDIQUE COMPLET (CHOL T, HDL, LDL, TRIG)', cote: 'B 45', defaultCoefType: 'B', coefMultiplier: 45, category: 'Biochimie' },
  { code: '0305', designation: 'TRANSAMINASES (ASAT / ALAT)', cote: 'B 30', defaultCoefType: 'B', coefMultiplier: 30, category: 'Biochimie' },
  { code: '0401', designation: 'EXAMEN CYTOBACTERIOLOGIQUE DES URINES (ECBU)', cote: 'B 45', defaultCoefType: 'B', coefMultiplier: 45, category: 'Bactériologie' },
  { code: '0402', designation: 'PRELEVEMENT CERVICO-VAGINAL (PCV / PV)', cote: 'B 45', defaultCoefType: 'B', coefMultiplier: 45, category: 'Bactériologie' },
  { code: '0403', designation: 'HEMOCULTURE AEROBIE & ANAEROBIE', cote: 'B 95', defaultCoefType: 'B', coefMultiplier: 95, category: 'Bactériologie' },
  { code: '0404', designation: 'FROTTIS CERVICO-VAGINAL ONCO-CYTOLOGIE (FROTTIS)', cote: 'P 50', defaultCoefType: 'P', coefMultiplier: 50, category: 'Cytologie' },
  { code: '0501', designation: 'SEROLOGIE DU VIH 1+2 (TEST RAPIDE CONFIRME)', cote: 'B 25', defaultCoefType: 'B', coefMultiplier: 25, category: 'Sérologie' },
  { code: '0502', designation: 'SEROLOGIE DE L\'HEPATITE B (AG HBS)', cote: 'B 30', defaultCoefType: 'B', coefMultiplier: 30, category: 'Sérologie' },
  { code: '0503', designation: 'SEROLOGIE DE L\'HEPATITE C (AC ANTI-HCV)', cote: 'B 35', defaultCoefType: 'B', coefMultiplier: 35, category: 'Sérologie' },
  { code: '0504', designation: 'SEROLOGIE DE LA SYPHILIS (TPHA / VDRL)', cote: 'B 20', defaultCoefType: 'B', coefMultiplier: 20, category: 'Sérologie' },
  { code: '0505', designation: 'SERODIAGNOSTIC DE WIDAL & FELIX (TYPHOIDE)', cote: 'B 20', defaultCoefType: 'B', coefMultiplier: 20, category: 'Sérologie' },
  { code: '0601', designation: 'BETA-HCG PLASMATIQUE QUANTITATIF (GROSSESSE)', cote: 'B 40', defaultCoefType: 'B', coefMultiplier: 40, category: 'Hormonologie' }
];

/**
 * Match test name to Cameroon Nomenclature Act Code
 */
export function findCameroonActForTest(testName: string): CameroonBillingNomenclature {
  const norm = (testName || '').toLowerCase().trim();
  if (norm.includes('creatin')) return CAMEROON_BILLING_ACTS.find(a => a.code === 'CREATS#')!;
  if (norm.includes('selle') || norm.includes('eps') || norm.includes('parasit')) return CAMEROON_BILLING_ACTS.find(a => a.code === 'EPS#')!;
  if (norm.includes('glyc') || norm.includes('sugar') || norm.includes('glucose')) return CAMEROON_BILLING_ACTS.find(a => a.code === 'GLYP#')!;
  if (norm.includes('ion') || norm.includes('electrolyt') || norm.includes('sodium') || norm.includes('potassium')) return CAMEROON_BILLING_ACTS.find(a => a.code === 'IONOC#')!;
  if (norm.includes('nfs') || norm.includes('cbc') || norm.includes('blood count') || norm.includes('hemogram')) return CAMEROON_BILLING_ACTS.find(a => a.code === 'NFSH#')!;
  if (norm.includes('transa') || norm.includes('asat') || norm.includes('alat') || norm.includes('sgot') || norm.includes('sgpt')) return CAMEROON_BILLING_ACTS.find(a => a.code === 'TRANSA#')!;
  if (norm.includes('uree') || norm.includes('urea') || norm.includes('bun')) return CAMEROON_BILLING_ACTS.find(a => a.code === 'UREE#')!;
  if (norm.includes('prelevement selle') || norm.includes('recolte')) return CAMEROON_BILLING_ACTS.find(a => a.code === 'PK#')!;
  if (norm.includes('prelevement sang') || norm.includes('phleb')) return CAMEROON_BILLING_ACTS.find(a => a.code === 'PSE#')!;
  if (norm.includes('ecbu') || norm.includes('urine culture')) return CAMEROON_BILLING_ACTS.find(a => a.code === '0401')!;
  if (norm.includes('vih') || norm.includes('hiv')) return CAMEROON_BILLING_ACTS.find(a => a.code === '0501')!;
  if (norm.includes('hepatite b') || norm.includes('hbs')) return CAMEROON_BILLING_ACTS.find(a => a.code === '0502')!;
  if (norm.includes('hepatite c') || norm.includes('hcv')) return CAMEROON_BILLING_ACTS.find(a => a.code === '0503')!;
  if (norm.includes('syphilis') || norm.includes('tpha') || norm.includes('vdrl')) return CAMEROON_BILLING_ACTS.find(a => a.code === '0504')!;
  if (norm.includes('widal') || norm.includes('typhoid')) return CAMEROON_BILLING_ACTS.find(a => a.code === '0505')!;
  if (norm.includes('hcg') || norm.includes('pregnancy')) return CAMEROON_BILLING_ACTS.find(a => a.code === '0601')!;
  
  // Default general biological act
  return {
    code: 'BIO#',
    designation: testName.toUpperCase(),
    cote: 'B 20',
    defaultCoefType: 'B',
    coefMultiplier: 20,
    category: 'Biologie Médicale'
  };
}


/**
 * Converts integer monetary amounts to formal French words
 * e.g., 14250 -> "quatorze mille deux cent cinquante Francs CFA"
 */
export function numberToFrenchWords(amount: number): string {
  const num = Math.floor(Math.abs(amount));
  if (num === 0) return 'zéro Francs CFA';

  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

  function convertGroup(n: number): string {
    let res = '';
    const h = Math.floor(n / 100);
    const r = n % 100;

    if (h > 0) {
      if (h === 1) {
        res += 'cent ';
      } else {
        res += units[h] + ' cent' + (r === 0 ? 's ' : ' ');
      }
    }

    if (r > 0) {
      if (r < 20) {
        res += units[r] + ' ';
      } else if (r < 70) {
        const t = Math.floor(r / 10);
        const u = r % 10;
        if (u === 1 && t !== 8) {
          res += tens[t] + ' et un ';
        } else if (u > 0) {
          res += tens[t] + '-' + units[u] + ' ';
        } else {
          res += tens[t] + ' ';
        }
      } else if (r < 80) {
        const u = r % 10;
        if (u === 1) {
          res += 'soixante et onze ';
        } else {
          res += 'soixante-' + units[10 + u] + ' ';
        }
      } else if (r < 90) {
        const u = r % 10;
        if (u === 0) {
          res += 'quatre-vingts ';
        } else {
          res += 'quatre-vingt-' + units[u] + ' ';
        }
      } else {
        const u = r % 10;
        res += 'quatre-vingt-' + units[10 + u] + ' ';
      }
    }

    return res.trim();
  }

  let words = '';
  const millions = Math.floor(num / 1000000);
  const thousands = Math.floor((num % 1000000) / 1000);
  const remainder = num % 1000;

  if (millions > 0) {
    if (millions === 1) {
      words += 'un million ';
    } else {
      words += convertGroup(millions) + ' millions ';
    }
  }

  if (thousands > 0) {
    if (thousands === 1) {
      words += 'mille ';
    } else {
      words += convertGroup(thousands) + ' mille ';
    }
  }

  if (remainder > 0) {
    words += convertGroup(remainder) + ' ';
  }

  const capitalized = words.trim().charAt(0).toUpperCase() + words.trim().slice(1);
  return `${capitalized} Francs CFA`;
}

export type CameroonInsuranceProvider = CameroonInsuranceCompany;
export const CAMEROON_INSURANCE_PROVIDERS = CAMEROON_INSURANCE_COMPANIES;

export interface PrelevementActCode {
  code: string;
  name: string;
  cote: string;
  multiplier: number;
  defaultCoefficient?: number | undefined;
  coefficientType: 'KB' | 'B' | 'P' | 'K';
  sampleType: string;
  defaultPrice: number;
}

export const PRELEVEMENT_ACT_CODES: PrelevementActCode[] = [
  {
    code: 'PSE#',
    name: 'ACTE DE PRELEVEMENT DE SANG ES',
    cote: 'KB1,5',
    multiplier: 1.5,
    coefficientType: 'KB',
    // defaultCoefficient: 1,
    sampleType: 'Blood / Serum / Plasma',
    defaultPrice: 372
  },
  {
    code: 'PK#',
    name: 'ACTE PRELEVEMENT SELLES',
    cote: 'KB1,0',
    multiplier: 1.0,
    coefficientType: 'KB',
    sampleType: 'Stool / Feces',
    defaultPrice: 240
  },
  {
    code: 'PU#',
    name: 'ACTE PRELEVEMENT URINES',
    cote: 'KB1,0',
    multiplier: 1.0,
    coefficientType: 'KB',
    sampleType: 'Urine',
    defaultPrice: 240
  },
  {
    code: 'PCV#',
    name: 'ACTE PRELEVEMENT CERVICO-VAGINAL / FROTTIS',
    cote: 'KB2,0',
    multiplier: 2.0,
    coefficientType: 'KB',
    sampleType: 'Cervical Swab',
    defaultPrice: 480
  },
  {
    code: 'PG#',
    name: 'ACTE PRELEVEMENT GORGE / NASOPHARYNGE',
    cote: 'KB1,0',
    multiplier: 1.0,
    coefficientType: 'KB',
    sampleType: 'Throat / Nasopharyngeal Swab',
    defaultPrice: 240
  }
];

