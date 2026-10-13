/**
 * Helper to format a referring doctor's name and affiliated hospital.
 *
 * Requirements:
 * 1. If self-referral / none / walk-in / empty, returns "Self-Referred / Walk-in".
 *    NEVER shows the laboratory, clinic, or hospital name (e.g. "Balm of Gilead") in place of a self-referral!
 * 2. If a doctor name is present along with a hospital (e.g. Dr. Kamga, Balm of Gilead):
 *    Formats clearly as "Dr. Kamga (Balm of Gilead)" or "Dr. Kamga — Balm of Gilead".
 * 3. If only a facility/hospital name was provided in the doctor field without a physician name:
 *    Treated as self-referred / institutional walk-in.
 */

export function isSelfReferral(val?: string | null): boolean {
    if (!val || typeof val !== 'string') return true;
    const clean = val.trim().toLowerCase();
    if (!clean) return true;
  
    const patterns = [
      'self',
      'self-referred',
      'self referred',
      'none',
      'auto',
      'sans prescripteur',
      'walk-in',
      'walkin',
      'direct',
      'patient',
      'outpatient',
      'general outpatient',
      'n/a',
      'na',
      'aucun',
      'non spécifié',
      'pas de prescripteur',
      'unspecified',
      'null',
      'undefined'
    ];
  
    return patterns.some(p => clean === p || clean.includes('self-refer') || clean.startsWith('self') || clean.startsWith('none'));
  }
  
  export function formatReferringDoctorWithHospital(booking: any): string {
    if (!booking) return 'Self-Referred / Walk-in';
  
    const rawRef = typeof booking.referringDoctor === 'string' ? booking.referringDoctor.trim() : '';
    const rawDoc = typeof booking.doctorName === 'string' ? booking.doctorName.trim() : '';
    const labName = typeof booking.labName === 'string' ? booking.labName.trim() : '';
    
    const hospital = typeof booking.referralHospital === 'string' 
      ? booking.referralHospital.trim() 
      : typeof booking.doctorHospital === 'string' 
      ? booking.doctorHospital.trim() 
      : typeof (booking as any).hospital === 'string'
      ? (booking as any).hospital.trim()
      : '';
  
    // Determine potential doctor name candidate
    let candidate = '';
    if (rawRef && !isSelfReferral(rawRef)) {
      candidate = rawRef;
    } else if (rawDoc && !isSelfReferral(rawDoc)) {
      candidate = rawDoc;
    }
  
    // If candidate is empty or recognized as self-referral
    if (!candidate || isSelfReferral(candidate)) {
      return 'Self-Referred / Walk-in';
    }
  
    // Check if candidate is actually just a hospital/lab name entered by mistake
    // (e.g. "Balm of Gilead", "Balm of Gilead Hospital", "nanoLabs", or generic clinic)
    const candidateLower = candidate.toLowerCase();
    const labLower = labName.toLowerCase();
    const hospitalLower = hospital.toLowerCase();
  
    const isJustFacilityName = 
      (labLower && (candidateLower === labLower || candidateLower.includes(labLower))) ||
      (hospitalLower && candidateLower === hospitalLower) ||
      candidateLower.includes('balm of gilead') ||
      (
        (candidateLower.startsWith('hôpital') || 
         candidateLower.startsWith('hopital') || 
         candidateLower.startsWith('clinique') || 
         candidateLower.startsWith('centre médical') || 
         candidateLower.startsWith('hospital') || 
         candidateLower.startsWith('medical center') ||
         candidateLower.startsWith('laboratory')) &&
        !candidateLower.includes('dr.') &&
        !candidateLower.includes('dr ') &&
        !candidateLower.includes('docteur')
      );
  
    if (isJustFacilityName) {
      // If it's only a facility name without a doctor name, it is a self-referral / outpatient visit
      return 'Self-Referred / Walk-in';
    }
  
    // Clean doctor name formatting
    let cleanDocName = candidate;
    if (!cleanDocName.toLowerCase().startsWith('dr.') && 
        !cleanDocName.toLowerCase().startsWith('dr ') && 
        !cleanDocName.toLowerCase().startsWith('docteur') && 
        !cleanDocName.toLowerCase().startsWith('pr.') && 
        !cleanDocName.toLowerCase().startsWith('prof.')) {
      cleanDocName = `Dr. ${cleanDocName}`;
    }
  
    // If a valid hospital is known and not already mentioned in the doctor's name
    const validHospital = hospital && !isSelfReferral(hospital) && !hospital.toLowerCase().includes('n/a') ? hospital : '';
  
    if (validHospital && !cleanDocName.toLowerCase().includes(validHospital.toLowerCase())) {
      return `${cleanDocName} (${validHospital})`;
    }
  
    return cleanDocName;
  }
  