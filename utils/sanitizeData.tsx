// utils/sanitizeData.ts

/**
 * Deeply cleans an object for Firestore by removing any `undefined` values,
 * converting them to empty strings or removing the keys so Firestore never throws
 * "Unsupported field value: undefined".
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
    if (obj === null || obj === undefined) {
      return {} as T;
    }
  
    const cleaned: any = Array.isArray(obj) ? [] : {};
  
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) {
        // Omit undefined keys or provide safe fallback
        continue;
      } else if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
        cleaned[key] = cleanFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    }
  
    return cleaned;
  }
  
  /**
   * Validates Cameroonian and international 9-digit mobile phone numbers.
   * Strips all non-digit characters. If prefixed with 237 (or +237), strips 237.
   * Validates that exactly 9 digits remain (e.g. 671234567, 691234567, 650000000).
   */
  export function validatePhoneNumber(phone: string): { 
    isValid: boolean; 
    digits: string; 
    formatted: string; 
    errorMessage?: string;
  } {
    if (!phone || typeof phone !== 'string') {
      return {
        isValid: false,
        digits: '',
        formatted: '',
        errorMessage: 'Phone number is required. Please provide a 9-digit phone number.'
      };
    }
  
    // Extract all numeric digits
    let digits = phone.replace(/\D/g, '');
  
    // If starts with Cameroon country code 237 and has 12 digits, strip country code
    if (digits.startsWith('237') && digits.length === 12) {
      digits = digits.slice(3);
    }
  
    // If starts with 00237 and has 14 digits, strip 00237
    if (digits.startsWith('00237') && digits.length === 14) {
      digits = digits.slice(5);
    }
  
    if (digits.length !== 9) {
      return {
        isValid: false,
        digits,
        formatted: phone.trim(),
        errorMessage: `Phone number must contain exactly 9 digits. You entered ${digits.length} digit${digits.length === 1 ? '' : 's'} (e.g. 671234567).`
      };
    }
  
    // Format as "+237 6XX XX XX XX" or "6XX XX XX XX"
    const formatted = `+237 ${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
  
    return {
      isValid: true,
      digits,
      formatted
    };
  }
  