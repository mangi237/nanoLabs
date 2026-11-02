// src/utils/labPackages.ts
// Single source of truth for nanoLabs SaaS subscription packages, December 15,000 XAF special promo,
// Mobile Phlebotomist opt-in gating, monthly test limits, staff seat limits, and module enforcement.

export type LabPackageId = 'december_promo' | 'clinic' | 'district' | 'regional';

export type LabFeatureKey =
  | 'core_lims'
  | 'online_invoicing'
  | 'mobile_phlebotomist'
  | 'templates'
  | 'insurance'
  | 'inventory'
  | 'doctors'
  | 'analytics'
  | 'reports';

export interface LabPackageDefinition {
  id: LabPackageId;
  legacyTier: 'small' | 'medium' | 'large';
  name: string;
  badge?: string;
  isPromo?: boolean;
  priceMonthlyXaf: number;
  priceLabel: string;
  maxTestsPerMonth: number;
  maxStaff: number;
  detail: string;
  summary: string;
  includedFeatures: LabFeatureKey[];
  includedBullets: string[];
  excludedBullets: string[];
}

export const LAB_PACKAGES: Record<LabPackageId, LabPackageDefinition> = {
  december_promo: {
    id: 'december_promo',
    legacyTier: 'small',
    name: 'December Special Package',
    badge: 'December Special • 15,000 XAF',
    isPromo: true,
    priceMonthlyXaf: 15000,
    priceLabel: '15,000 FCFA / month',
    maxTestsPerMonth: 500,
    maxStaff: 5,
    detail: 'Up to 500 tests/mo • Max 5 staff accounts',
    summary: 'Festive December onboarding package for clinics & diagnostic centers getting started digitally.',
    includedFeatures: ['core_lims', 'online_invoicing', 'mobile_phlebotomist', 'templates'],
    includedBullets: [
      'Up to 500 diagnostic tests / month',
      'Up to 5 staff accounts (Reception, Cashier, Lab Tech, Biologist)',
      'Online Patient Test Requests & Dynamic Cashier Invoicing',
      'Signed Official Laboratory Result PDFs',
      'Optional Mobile Phlebotomist Home Sample Pickup (if selected)',
    ],
    excludedBullets: [
      'Insurance & Corporate Split Billing (Requires Clinic 25k+)',
      'Inventory & Reagent Stock Manager (Requires District 45k+)',
      'Referring Doctor Commission Network (Requires District 45k+)',
      'Executive Analytics & Audit Reports (Requires Regional 75k)',
    ],
  },
  clinic: {
    id: 'clinic',
    legacyTier: 'small',
    name: 'Clinic / Solo',
    priceMonthlyXaf: 25000,
    priceLabel: '25,000 FCFA / month',
    maxTestsPerMonth: 1000,
    maxStaff: 8,
    detail: 'Up to 1,000 tests/mo • Max 8 staff accounts',
    summary: 'Complete outpatient laboratory workflow with Cameroon Insurance COTE & split-billing support.',
    includedFeatures: ['core_lims', 'online_invoicing', 'mobile_phlebotomist', 'templates', 'insurance'],
    includedBullets: [
      'Up to 1,000 diagnostic tests / month',
      'Up to 8 staff accounts',
      'Cameroon Insurance & COTE Split-Billing Engine',
      'Custom Header & Footer Report Templates + Signed PDFs',
      'Optional Mobile Phlebotomist Home Sample Pickup (if selected)',
    ],
    excludedBullets: [
      'Inventory & Reagent Stock Manager (Requires District 45k+)',
      'Referring Doctor Commission Network (Requires District 45k+)',
      'Executive Analytics & Audit Reports (Requires Regional 75k)',
    ],
  },
  district: {
    id: 'district',
    legacyTier: 'medium',
    name: 'District Hospital',
    priceMonthlyXaf: 45000,
    priceLabel: '45,000 FCFA / month',
    maxTestsPerMonth: 1400,
    maxStaff: 20,
    detail: 'Up to 1,400 tests/mo • Max 20 staff accounts',
    summary: 'Full hospital diagnostics with reagent inventory control and partner physician referral tracking.',
    includedFeatures: [
      'core_lims',
      'online_invoicing',
      'mobile_phlebotomist',
      'templates',
      'insurance',
      'inventory',
      'doctors',
    ],
    includedBullets: [
      'Up to 1,400 diagnostic tests / month',
      'Up to 20 staff accounts',
      'Reagent & Consumables Inventory Manager',
      'Referring Doctor Commission & Partner Network',
      'Insurance Split Billing + Optional Mobile Phlebotomist',
    ],
    excludedBullets: [
      'Unlimited Monthly Tests & Staff (Requires Regional 75k)',
      'Executive Analytics & Financial Audit Suite (Requires Regional 75k)',
    ],
  },
  regional: {
    id: 'regional',
    legacyTier: 'large',
    name: 'Regional Reference',
    badge: 'All Features Unlocked',
    priceMonthlyXaf: 75000,
    priceLabel: '75,000 FCFA / month',
    maxTestsPerMonth: 999999,
    maxStaff: 999,
    detail: 'Unlimited tests/mo • Unlimited staff accounts',
    summary: 'Enterprise reference laboratory suite with unlimited capacity, full analytics, and audit intelligence.',
    includedFeatures: [
      'core_lims',
      'online_invoicing',
      'mobile_phlebotomist',
      'templates',
      'insurance',
      'inventory',
      'doctors',
      'analytics',
      'reports',
    ],
    includedBullets: [
      'Unlimited diagnostic tests / month',
      'Unlimited staff accounts across all desks',
      'Executive Financial Analytics & Tamper-Proof Audit Logs',
      'Inventory Automation + Referring Doctors + Insurance COTE',
      'Optional Mobile Phlebotomist GPS Dispatch & Live Tracking',
    ],
    excludedBullets: [],
  },
};

export const LAB_PACKAGE_LIST: LabPackageDefinition[] = [
  LAB_PACKAGES.december_promo,
  LAB_PACKAGES.clinic,
  LAB_PACKAGES.district,
  LAB_PACKAGES.regional,
];

/**
 * Resolves any lab object (including legacy tier names) to its active LabPackageDefinition.
 * Note: Default built-in demo lab ('lab-1') defaults to 'regional' unless explicitly assigned a plan,
 * while newly registered labs strictly enforce their chosen `plan` / `subscriptionTier`.
 */
export function getLabPackageConfig(lab: any): LabPackageDefinition {
  if (!lab) return LAB_PACKAGES.regional;

  const rawPlan = String(lab.plan || lab.planId || '').toLowerCase().trim();
  if (rawPlan === 'december_promo' || rawPlan === 'december' || rawPlan === 'promo' || rawPlan === 'universal') {
    return LAB_PACKAGES.december_promo;
  }
  if (rawPlan === 'clinic') return LAB_PACKAGES.clinic;
  if (rawPlan === 'district') return LAB_PACKAGES.district;
  if (rawPlan === 'regional') return LAB_PACKAGES.regional;

  const rawTier = String(lab.subscriptionTier || '').toLowerCase().trim();
  if (rawTier === 'december_promo') return LAB_PACKAGES.december_promo;
  if (rawTier === 'small' || rawTier === 'starter') {
    if (Number(lab.subscriptionPrice) === 15000) return LAB_PACKAGES.december_promo;
    return LAB_PACKAGES.clinic;
  }
  if (rawTier === 'medium' || rawTier === 'growth') return LAB_PACKAGES.district;
  if (rawTier === 'large' || rawTier === 'business' || rawTier === 'enterprise') return LAB_PACKAGES.regional;

  // Built-in default seed labs without explicit plan keep full capabilities unless changed
  if (lab.id === 'lab-1' || lab.id === 'lab-central' || lab.id === 'lab-plus') {
    return LAB_PACKAGES.regional;
  }

  return LAB_PACKAGES.clinic;
}

/**
 * Strictly determines if a laboratory opted into Mobile Phlebotomist (Home Sample Pickup)
 * during account creation or in facility settings AND its package supports it.
 */
export function isLabMobilePhlebotomyEnabled(lab: any): boolean {
  if (!lab) return false;

  const pkg = getLabPackageConfig(lab);
  if (!pkg.includedFeatures.includes('mobile_phlebotomist')) {
    return false;
  }

  // Explicit boolean flags set during Lab Registration or Admin configuration take top priority
  if (typeof lab.needsMobilePhlebotomist === 'boolean') {
    return lab.needsMobilePhlebotomist;
  }
  if (typeof lab.supportsHomePickup === 'boolean') {
    return lab.supportsHomePickup;
  }

  // Check features array if present on partner lab object
  if (Array.isArray(lab.features)) {
    return lab.features.some((f: any) => String(f || '').toLowerCase().includes('home'));
  }

  // Built-in default demo labs ('lab-1', 'lab-central') have home pickup enabled unless turned off
  if (lab.id === 'lab-1' || lab.id === 'lab-central') {
    return true;
  }

  // Newly created labs that did NOT select needsMobilePhlebotomist default to false!
  return false;
}

/**
 * Checks whether a lab's active subscription package unlocks a specific feature/module.
 */
export function canLabUseFeature(lab: any, feature: LabFeatureKey): boolean {
  if (feature === 'mobile_phlebotomist') {
    return isLabMobilePhlebotomyEnabled(lab);
  }
  if (lab?.pricingModel === 'pay_per_test') {
    // Commission per-test model unlocks operational modules
    return true;
  }
  const pkg = getLabPackageConfig(lab);
  return pkg.includedFeatures.includes(feature);
}

/**
 * Returns the minimum package name required for a locked feature.
 */
export function getRequiredPackageNameForFeature(feature: LabFeatureKey): string {
  switch (feature) {
    case 'insurance':
      return 'Clinic / Solo (25,000 FCFA/mo)';
    case 'inventory':
    case 'doctors':
      return 'District Hospital (45,000 FCFA/mo)';
    case 'analytics':
    case 'reports':
      return 'Regional Reference (75,000 FCFA/mo)';
    default:
      return 'Clinic / Solo (25,000 FCFA/mo)';
  }
}

/**
 * Checks if a laboratory can process `additionalTestsCount` more tests in the current calendar month.
 */
export function checkLabMonthlyTestQuota(
  lab: any,
  currentMonthTestsCount: number,
  additionalTestsCount: number = 1
): {
  allowed: boolean;
  used: number;
  limit: number;
  packageName: string;
  errorMessage?: string;
} {
  if (!lab || lab.pricingModel === 'pay_per_test') {
    return {
      allowed: true,
      used: currentMonthTestsCount,
      limit: 999999,
      packageName: 'Per-Test Commission',
    };
  }

  const pkg = getLabPackageConfig(lab);
  const limit = Number(lab.maxTestsPerMonth) > 0 ? Number(lab.maxTestsPerMonth) : pkg.maxTestsPerMonth;

  if (limit >= 999999) {
    return {
      allowed: true,
      used: currentMonthTestsCount,
      limit,
      packageName: pkg.name,
    };
  }

  if (currentMonthTestsCount + additionalTestsCount > limit) {
    return {
      allowed: false,
      used: currentMonthTestsCount,
      limit,
      packageName: pkg.name,
      errorMessage: `Monthly package limit reached for ${lab.name || 'this laboratory'} (${currentMonthTestsCount}/${limit.toLocaleString()} tests used on the ${pkg.name} plan). Please upgrade your subscription package to process additional tests.`,
    };
  }

  return {
    allowed: true,
    used: currentMonthTestsCount,
    limit,
    packageName: pkg.name,
  };
}
