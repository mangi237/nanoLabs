/**
 * Strict Patient Record Ownership & Isolation Guard
 *
 * Prevents cross-account data leaks where legacy shared placeholder IDs
 * (such as "profile_self", "patient_primary", "Patient", or "+237 670 00 00 00")
 * previously caused newly created or signed-in patient accounts to match
 * other patients' laboratory bookings.
 */

const FORBIDDEN_GENERIC_IDS = new Set([
  '',
  'profile_self',
  'patient_primary',
  'demo-pat-1',
  'demo',
  'self',
  'patient',
  'unknown',
]);

const FORBIDDEN_GENERIC_PHONES = new Set([
  '',
  '237670000000',
  '670000000',
  '237670112233',
  '670112233',
  '237671223344',
  '671223344',
  '000000000',
]);

export function isValidUniqueId(val?: string | null): boolean {
  if (!val) return false;
  const trimmed = String(val).trim();
  if (!trimmed) return false;
  return !FORBIDDEN_GENERIC_IDS.has(trimmed.toLowerCase());
}

export function normalizeCameroonDigits(phone?: string | null): string {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 8) return '';
  if (FORBIDDEN_GENERIC_PHONES.has(digits)) return '';
  // Normalize 237XXXXXXXXX -> last 9 digits
  return digits.length > 9 && digits.startsWith('237') ? digits.slice(-9) : digits;
}

/**
 * Determines if a laboratory booking belongs strictly to the currently signed-in patient
 * (or their active dependent family member profile).
 */
export function doesBookingBelongToPatient(
  booking: any,
  user: any,
  activeProfile?: any,
  isDependentActive: boolean = false
): boolean {
  if (!booking || !user) return false;

  const accountId = isValidUniqueId(user.id) ? String(user.id).trim() : '';
  if (!accountId || booking.patientAccountId !== accountId) return false;
  if (isDependentActive) return Boolean(activeProfile?.id && booking.dependentProfileId === activeProfile.id);
  return !booking.dependentProfileId;
}
