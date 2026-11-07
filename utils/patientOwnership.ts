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

  const userDocId = isValidUniqueId(user.id) ? String(user.id).trim() : '';
  const userPid = isValidUniqueId(user.patientId) ? String(user.patientId).trim() : '';
  const userPhone9 = normalizeCameroonDigits(user.phone || user.phoneDigits);

  const bookingAccountId = isValidUniqueId(booking.patientAccountId)
    ? String(booking.patientAccountId).trim()
    : '';
  const bookingPid = isValidUniqueId(booking.patientPid) ? String(booking.patientPid).trim() : '';
  const bookingPatientId = isValidUniqueId(booking.patientId)
    ? String(booking.patientId).trim()
    : '';
  const bookingDepId = isValidUniqueId(booking.dependentProfileId)
    ? String(booking.dependentProfileId).trim()
    : '';
  const bookingPhone9 = normalizeCameroonDigits(booking.patientPhone);

  // If booking explicitly belongs to a DIFFERENT registered patientAccountId, immediately reject!
  if (bookingAccountId && userDocId && bookingAccountId !== userDocId && bookingAccountId !== userPid) {
    return false;
  }

  if (isDependentActive && activeProfile) {
    const depId = isValidUniqueId(activeProfile.id) ? String(activeProfile.id).trim() : '';
    if (!depId) return false;
    return bookingDepId === depId || bookingPid === depId || bookingPatientId === depId;
  }

  // If booking is tagged for a dependent sub-profile, don't mix into 'self' primary view unless ID matches self
  if (bookingDepId && bookingDepId !== userDocId && bookingDepId !== userPid) {
    return false;
  }

  // 1. Direct cryptographic/database account ID or unique PID match
  if (userDocId && (bookingAccountId === userDocId || bookingPatientId === userDocId || bookingPid === userDocId)) {
    return true;
  }
  if (userPid && (bookingPid === userPid || bookingPatientId === userPid || bookingAccountId === userPid)) {
    return true;
  }

  // 2. Walk-in lab order linked by verified unique 9-digit phone number (ONLY when no conflicting unique PID/accountId exists)
  if (!bookingAccountId && !bookingPid.startsWith('PAT-') && userPhone9 && bookingPhone9 && userPhone9 === bookingPhone9) {
    return true;
  }

  return false;
}
