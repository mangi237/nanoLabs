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

export const authService = {
  async verifyAccessCode(code: string, labId: string): Promise<AuthResult> {
    try {
      console.log('🔍 verifyAccessCode called with:', { code, labId });

      // ✅ SUPER ADMIN - HARDCODED (NO FIREBASE)
      if (code === 'SUPER123' || code === 'ADMIN123') {
        console.log('✅ Super Admin detected!');
        return {
          success: true,
          user: { 
            id: 'superAdmin', 
            name: 'Super Admin',
            role: 'superadmin',
            roles: ['superadmin']
          },
          lab: null,
          role: 'superadmin'
        };
      }

      // Check if labId is provided
      if (!labId) {
        return { 
          success: false, 
          error: 'Please select a lab first.' 
        };
      }

      // Check staff in lab
      console.log('🔍 Checking staff at: labs/', labId, '/staff');
      const staffRef = collection(db, 'labs', labId, 'staff');
      const staffQuery = query(staffRef, where('accessCode', '==', code));
      const staffSnapshot = await getDocs(staffQuery);

      if (!staffSnapshot.empty) {
        const staffDoc = staffSnapshot.docs[0];
        const staffData = staffDoc.data();
        console.log('✅ Staff found:', staffData.name);
        
        const labRef = doc(db, 'labs', labId);
        const labDoc = await getDoc(labRef);
        const labData = labDoc.exists() ? labDoc.data() : { name: 'Lab' };
        
        return {
          success: true,
          user: { 
            id: staffDoc.id, 
            ...staffData,
            roles: staffData.roles || [staffData.primaryRole || 'staff']
          },
          lab: { 
            id: labId, 
            name: labData.name || 'Lab',
            primaryColor: labData.primaryColor || '#1A237E'
          },
          role: staffData.roles?.[0] || staffData.primaryRole || 'staff'
        };
      }

      // Check patients in lab
      console.log('🔍 Checking patients at: labs/', labId, '/patients');
      const patientsRef = collection(db, 'labs', labId, 'patients');
      const patientsQuery = query(patientsRef, where('accessCode', '==', code));
      const patientsSnapshot = await getDocs(patientsQuery);

      if (!patientsSnapshot.empty) {
        const patientDoc = patientsSnapshot.docs[0];
        const patientData = patientDoc.data();
        console.log('✅ Patient found:', patientData.name);
        
        const labRef = doc(db, 'labs', labId);
        const labDoc = await getDoc(labRef);
        const labData = labDoc.exists() ? labDoc.data() : { name: 'Lab' };
        
        return {
          success: true,
          user: { 
            id: patientDoc.id, 
            ...patientData,
            role: 'patient',
            roles: ['patient']
          },
          lab: { 
            id: labId, 
            name: labData.name || 'Lab',
            primaryColor: labData.primaryColor || '#1A237E'
          },
          role: 'patient'
        };
      }

      console.log('❌ No user found with code:', code);
      return { 
        success: false, 
        error: 'Invalid access code. Please check and try again.' 
      };
    } catch (error: any) {
      console.error('❌ Error in verifyAccessCode:', error);
      return { 
        success: false, 
        error: error.message || 'Network error. Please check your connection.' 
      };
    }
  },

  async getAllLabs() {
    try {
      console.log('🔍 Fetching all labs...');
      const labsRef = collection(db, 'labs');
      const snapshot = await getDocs(labsRef);
      const labs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('✅ Labs found:', labs.length);
      return labs;
    } catch (error) {
      console.error('Error fetching labs:', error);
      return [];
    }
  },

  async getLabDetails(labId: string) {
    try {
      if (!labId) return null;
      
      console.log('🔍 Fetching lab details:', labId);
      const labRef = doc(db, 'labs', labId);
      const labDoc = await getDoc(labRef);
      if (labDoc.exists()) {
        return { id: labDoc.id, ...labDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching lab details:', error);
      return null;
    }
  },

  async registerPatient(labId: string, patientData: any) {
    try {
      if (!labId) {
        return { success: false, error: 'Lab ID is required' };
      }

      console.log('🔍 Registering patient in lab:', labId);
      const patientsRef = collection(db, 'labs', labId, 'patients');
      
      const newPatient = {
        ...patientData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(patientsRef, newPatient);
      console.log('✅ Patient registered:', docRef.id);
      
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