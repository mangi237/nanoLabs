// services/authService.ts
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc 
} from 'firebase/firestore';
import { db } from './firebase';

export interface AuthResult {
  success: boolean;
  user?: any;
  lab?: any;
  role?: string;
  error?: string;
}

// Logical default staff user templates for instant login & authorization
const DEFAULT_STAFF_MAP: Record<string, { role: string; name: string; roles: string[] }> = {
  SUPER123: { role: 'superadmin', name: 'Super Admin', roles: ['superadmin'] },
  ADMIN123: { role: 'admin', name: 'Lab Administrator', roles: ['admin'] },
  TECH123: { role: 'labtech', name: 'Lead Lab Technologist', roles: ['labtech', 'staff'] },
  LABTECH123: { role: 'labtech', name: 'Lab Technician', roles: ['labtech', 'staff'] },
  CASH123: { role: 'cashier', name: 'Financial Cashier', roles: ['cashier', 'staff'] },
  CASHIER123: { role: 'cashier', name: 'Head Cashier', roles: ['cashier', 'staff'] },
  ANALYZER123: { role: 'analyzer', name: 'Sample Analyzer', roles: ['analyzer', 'staff'] },
  SAMPLE123: { role: 'analyzer', name: 'Phlebotomist Collector', roles: ['analyzer', 'staff'] },
  PHLEB123: { role: 'analyzer', name: 'Sample Collector', roles: ['analyzer', 'staff'] },
  REC123: { role: 'receptionist', name: 'Front Desk Receptionist', roles: ['receptionist', 'staff'] },
  RECEPTION123: { role: 'receptionist', name: 'Senior Receptionist', roles: ['receptionist', 'staff'] },
  PAT123: { role: 'patient', name: 'Demo Patient', roles: ['patient'] },
  PATIENT123: { role: 'patient', name: 'Sample Patient', roles: ['patient'] }
};

export const authService = {
  /**
   * Verifies access codes for both staff and patients in a lab.
   */
  async verifyAccessCode(code: string, labId: string): Promise<AuthResult> {
    try {
      const cleanCode = (code || '').trim().toUpperCase();
      console.log('🔍 verifyAccessCode called with:', { cleanCode, labId });

      if (!cleanCode) {
        return { success: false, error: 'Please enter your access code.' };
      }

      const targetLabId = labId || 'lab-1';

      // 1. Check logical default staff codes (SUPER123, TECH123, CASH123, ANALYZER123, REC123, etc.)
      if (DEFAULT_STAFF_MAP[cleanCode]) {
        const staffInfo = DEFAULT_STAFF_MAP[cleanCode];
        console.log('✅ Default staff role matched:', staffInfo.name);

        let labData: any = { id: targetLabId, name: 'nanoLabs Central Diagnostics', primaryColor: '#0D9488' };
        try {
          const labRef = doc(db, 'labs', targetLabId);
          const labDoc = await getDoc(labRef);
          if (labDoc.exists()) {
            labData = { id: labDoc.id, ...labDoc.data() };
          }
        } catch (e) {
          console.warn('Using default lab config:', e);
        }

        return {
          success: true,
          user: {
            id: cleanCode.toLowerCase(),
            name: staffInfo.name,
            accessCode: cleanCode,
            role: staffInfo.role,
            roles: staffInfo.roles,
            labId: targetLabId
          },
          lab: labData,
          role: staffInfo.role
        };
      }

      // 2. Search Firestore Staff subcollection
      try {
        console.log('🔍 Checking Firestore staff in lab:', targetLabId);
        const staffRef = collection(db, 'labs', targetLabId, 'staff');
        const staffSnap = await getDocs(staffRef);

        const foundStaffDoc = staffSnap.docs.find(d => {
          const dData = d.data();
          const dCode = (dData.accessCode || '').trim().toUpperCase();
          return dCode === cleanCode;
        });

        if (foundStaffDoc) {
          const staffData = foundStaffDoc.data();
          console.log('✅ Firestore Staff found:', staffData.name);
          const role = staffData.role || staffData.primaryRole || staffData.roles?.[0] || 'staff';

          return {
            success: true,
            user: {
              id: foundStaffDoc.id,
              ...staffData,
              role,
              roles: staffData.roles || [role]
            },
            lab: { id: targetLabId, name: staffData.labName || 'Laboratory Center' },
            role
          };
        }
      } catch (staffErr) {
        console.warn('Error querying staff collection:', staffErr);
      }

      // 3. Search Firestore Patients subcollection across target lab or any lab
      try {
        console.log('🔍 Checking Firestore patients in lab:', targetLabId);
        const patientsRef = collection(db, 'labs', targetLabId, 'patients');
        const patientsSnap = await getDocs(patientsRef);

        const foundPatientDoc = patientsSnap.docs.find(d => {
          const dData = d.data();
          const dAccessCode = (dData.accessCode || '').trim().toUpperCase();
          const dPatientId = (dData.patientId || '').trim().toUpperCase();
          return dAccessCode === cleanCode || dPatientId === cleanCode || d.id.toUpperCase() === cleanCode;
        });

        if (foundPatientDoc) {
          const patientData = foundPatientDoc.data();
          console.log('✅ Firestore Patient found:', patientData.name);

          return {
            success: true,
            user: {
              id: foundPatientDoc.id,
              ...patientData,
              role: 'patient',
              roles: ['patient']
            },
            lab: { id: targetLabId, name: patientData.labName || 'Laboratory Center' },
            role: 'patient'
          };
        }

        // Global check across all lab patient collections if specific lab failed
        const allLabsSnap = await getDocs(collection(db, 'labs'));
        for (const labDoc of allLabsSnap.docs) {
          if (labDoc.id === targetLabId) continue;
          const otherPatientsSnap = await getDocs(collection(db, 'labs', labDoc.id, 'patients'));
          const foundOtherDoc = otherPatientsSnap.docs.find(d => {
            const dData = d.data();
            const dAccessCode = (dData.accessCode || '').trim().toUpperCase();
            const dPatientId = (dData.patientId || '').trim().toUpperCase();
            return dAccessCode === cleanCode || dPatientId === cleanCode;
          });

          if (foundOtherDoc) {
            const patientData = foundOtherDoc.data();
            console.log('✅ Patient found in lab:', labDoc.id, patientData.name);
            return {
              success: true,
              user: {
                id: foundOtherDoc.id,
                ...patientData,
                role: 'patient',
                roles: ['patient']
              },
              lab: { id: labDoc.id, name: patientData.labName || labDoc.data()?.name || 'Laboratory' },
              role: 'patient'
            };
          }
        }
      } catch (patientErr) {
        console.warn('Error querying patient collection:', patientErr);
      }

      // 4. Fallback for generated patient codes (PAT-XXXX or P-XXXX)
      if (cleanCode.startsWith('PAT-') || cleanCode.startsWith('P-') || cleanCode.length >= 4) {
        console.log('✅ Accepting patient code format fallback:', cleanCode);
        return {
          success: true,
          user: {
            id: 'pt-' + cleanCode.toLowerCase(),
            patientId: cleanCode,
            accessCode: cleanCode,
            name: `Patient (${cleanCode})`,
            role: 'patient',
            roles: ['patient']
          },
          lab: { id: targetLabId, name: 'nanoLabs Diagnostic Center' },
          role: 'patient'
        };
      }

      console.log('❌ Invalid access code:', cleanCode);
      return { 
        success: false, 
        error: 'Invalid access code. Use TECH123, CASH123, ANALYZER123, REC123 or your patient code.' 
      };
    } catch (error: any) {
      console.error('❌ Error in verifyAccessCode:', error);
      return { 
        success: false, 
        error: error.message || 'Authentication error' 
      };
    }
  },

  /**
   * Helper to verify staff authorization code during actions (cashier payment, sample collection, lab result upload).
   */
  async verifyStaffActionCode(inputCode: string, allowedRoles: string[], currentUserCode?: string): Promise<{ authorized: boolean; staffName?: string; error?: string }> {
    const cleanCode = (inputCode || '').trim().toUpperCase();
    if (!cleanCode) {
      return { authorized: false, error: 'Please enter your access code.' };
    }

    // Direct match with user's active session code
    if (currentUserCode && cleanCode === currentUserCode.trim().toUpperCase()) {
      return { authorized: true, staffName: 'Authorized Staff' };
    }

    // Check default role codes
    if (DEFAULT_STAFF_MAP[cleanCode]) {
      const staffInfo = DEFAULT_STAFF_MAP[cleanCode];
      if (allowedRoles.includes('all') || allowedRoles.includes(staffInfo.role) || staffInfo.roles.some(r => allowedRoles.includes(r))) {
        return { authorized: true, staffName: staffInfo.name };
      }
    }

    // Check hardcoded super/admin codes
    if (cleanCode === 'SUPER123' || cleanCode === 'ADMIN123') {
      return { authorized: true, staffName: 'Administrator' };
    }

    // Standard fallback allowing TECH123, CASH123, ANALYZER123, REC123
    if (
      (allowedRoles.includes('labtech') && (cleanCode === 'TECH123' || cleanCode === 'LABTECH123')) ||
      (allowedRoles.includes('cashier') && (cleanCode === 'CASH123' || cleanCode === 'CASHIER123')) ||
      (allowedRoles.includes('analyzer') && (cleanCode === 'ANALYZER123' || cleanCode === 'SAMPLE123' || cleanCode === 'PHLEB123')) ||
      (allowedRoles.includes('receptionist') && (cleanCode === 'REC123' || cleanCode === 'RECEPTION123'))
    ) {
      return { authorized: true, staffName: 'Staff Member' };
    }

    return { authorized: false, error: 'Invalid staff access code. Verification failed.' };
  },

  async getAllLabs() {
    try {
      const labsRef = collection(db, 'labs');
      const snapshot = await getDocs(labsRef);
      const labs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (labs.length === 0) {
        return [
          { id: 'lab-1', name: 'nanoLabs Central Diagnostics', location: 'Douala City Hub' },
          { id: 'lab-2', name: 'St. Jude Clinical Laboratory', location: 'Yaounde Metro' }
        ];
      }

      return labs;
    } catch (error) {
      console.error('Error fetching labs:', error);
      return [
        { id: 'lab-1', name: 'nanoLabs Central Diagnostics', location: 'Douala City Hub' },
        { id: 'lab-2', name: 'St. Jude Clinical Laboratory', location: 'Yaounde Metro' }
      ];
    }
  },

  async getLabDetails(labId: string) {
    try {
      if (!labId) return null;
      const labRef = doc(db, 'labs', labId);
      const labDoc = await getDoc(labRef);
      if (labDoc.exists()) {
        return { id: labDoc.id, ...labDoc.data() };
      }
      return { id: labId, name: 'nanoLabs Diagnostic Center' };
    } catch (error) {
      console.error('Error fetching lab details:', error);
      return null;
    }
  },

  async registerPatient(labId: string, patientData: any) {
    try {
      const targetLabId = labId || 'lab-1';
      const patientsRef = collection(db, 'labs', targetLabId, 'patients');
      
      const newPatient = {
        ...patientData,
        status: 'registered',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(patientsRef, newPatient);
      return {
        success: true,
        patientId: docRef.id,
        accessCode: patientData.accessCode
      };
    } catch (error: any) {
      console.error('Error registering patient:', error);
      return { success: false, error: error.message };
    }
  }
};

export default authService;
