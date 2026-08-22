export interface CameroonInsuranceCompany {
  id: string;
  name: string;
  shortName: string;
  city: string;
  phone?: string;
  supportEmail?: string;
  code: string;
  logoColor?: string;
}

export const CAMEROON_INSURANCE_COMPANIES: CameroonInsuranceCompany[] = [
  {
    id: 'activa',
    name: 'Activa Assurances (Douala)',
    shortName: 'Activa Assurances',
    city: 'Douala',
    code: 'ACT-DLA',
    phone: '+237 233 43 01 00',
    supportEmail: 'contact@group-activa.com',
    logoColor: '#0055A5'
  },
  {
    id: 'axa',
    name: 'AXA Assurances Cameroun (Douala)',
    shortName: 'AXA Cameroun',
    city: 'Douala',
    code: 'AXA-CMR',
    phone: '+237 233 42 88 00',
    supportEmail: 'service.client@axa.cm',
    logoColor: '#00008F'
  },
  {
    id: 'chanas',
    name: 'Chanas Assurances (Douala)',
    shortName: 'Chanas Assurances',
    city: 'Douala',
    code: 'CHA-DLA',
    phone: '+237 233 42 24 38',
    supportEmail: 'contact@chanas-assurances.com',
    logoColor: '#D97706'
  },
  {
    id: 'sanlam',
    name: 'Sanlam Allianz Cameroun (Douala)',
    shortName: 'Sanlam Allianz',
    city: 'Douala',
    code: 'SAN-CMR',
    phone: '+237 233 42 01 40',
    supportEmail: 'contact.cameroun@sanlamallianz.com',
    logoColor: '#0284C7'
  },
  {
    id: 'sunu',
    name: 'SUNU Assurances (Douala)',
    shortName: 'SUNU Assurances',
    city: 'Douala',
    code: 'SUNU-DLA',
    phone: '+237 233 42 12 40',
    supportEmail: 'cameroun.assurances@sunu-group.com',
    logoColor: '#DC2626'
  },
  {
    id: 'nsia',
    name: 'NSIA Assurances (Douala)',
    shortName: 'NSIA Assurances',
    city: 'Douala',
    code: 'NSIA-CMR',
    phone: '+237 233 42 34 50',
    supportEmail: 'nsiaassurancescmr@groupensia.com',
    logoColor: '#16A34A'
  },
  {
    id: 'saar',
    name: 'SAAR S.A. (Yaoundé / Douala)',
    shortName: 'SAAR Assurances',
    city: 'Yaoundé / Douala',
    code: 'SAAR-SA',
    phone: '+237 222 20 28 88',
    supportEmail: 'saar@saar-assurances.com',
    logoColor: '#7C3AED'
  },
  {
    id: 'prudential',
    name: 'Prudential Beneficial Life Insurance (Douala)',
    shortName: 'Prudential Beneficial',
    city: 'Douala',
    code: 'PRU-BEN',
    phone: '+237 233 42 55 10',
    supportEmail: 'service@beneficial.cm',
    logoColor: '#EA580C'
  },
  {
    id: 'agc',
    name: 'Assurances Générales du Cameroun - AGC (Douala)',
    shortName: 'AGC Assurances',
    city: 'Douala',
    code: 'AGC-DLA',
    phone: '+237 233 42 82 82',
    supportEmail: 'agc@agc-cameroun.com',
    logoColor: '#0D9488'
  },
  {
    id: 'zenithe',
    name: 'Zenithe Insurance (Douala)',
    shortName: 'Zenithe Insurance',
    city: 'Douala',
    code: 'ZEN-DLA',
    phone: '+237 233 43 11 00',
    supportEmail: 'info@zenitheinsurance.com',
    logoColor: '#059669'
  }
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
