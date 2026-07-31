import { collection, query, where, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface AuthResult {
  success: boolean;
  user?: any;
  lab?: any;
  role?: string;
  error?: string;
}

export const authService = {
  // Verify access code for lab login
  async verifyAccessCode(code: string, labId: string): Promise<AuthResult> {
    try {
      // Check if it's a super admin
      if (code === 'SUPER123' || code === 'ADMIN123') {
        const superAdminRef = doc(db, 'superAdmin', 'settings');
        const superAdminDoc = await getDoc(superAdminRef);
        
        if (superAdminDoc.exists()) {
          const data = superAdminDoc.data();
          if (data.accessCode === code) {
            return {
              success: true,
              user: { id: 'superAdmin', name: 'Super Admin', role: 'superadmin' },
              lab: null,
              role: 'superadmin'
            };
          }
        }
      }

      // Check staff in lab
      const staffRef = collection(db, 'labs', labId, 'staff');
      const staffQuery = query(staffRef, where('accessCode', '==', code));
      const staffSnapshot = await getDocs(staffQuery);

      if (!staffSnapshot.empty) {
        const staffDoc = staffSnapshot.docs[0];
        const staffData = staffDoc.data();
        
        return {
          success: true,
          user: { 
            id: staffDoc.id, 
            ...staffData,
            roles: staffData.roles || [staffData.primaryRole]
          },
          lab: { id: labId },
          role: staffData.roles?.[0] || staffData.primaryRole || 'staff'
        };
      }

      // Check patients in lab
      const patientsRef = collection(db, 'labs', labId, 'patients');
      const patientsQuery = query(patientsRef, where('accessCode', '==', code));
      const patientsSnapshot = await getDocs(patientsQuery);

      if (!patientsSnapshot.empty) {
        const patientDoc = patientsSnapshot.docs[0];
        const patientData = patientDoc.data();
        
        return {
          success: true,
          user: { 
            id: patientDoc.id, 
            ...patientData,
            role: 'patient'
          },
          lab: { id: labId },
          role: 'patient'
        };
      }

      return { 
        success: false, 
        error: 'Invalid access code. Please check and try again.' 
      };
    } catch (error: any) {
      console.error('Error verifying access code:', error);
      return { 
        success: false, 
        error: 'Network error. Please check your connection.' 
      };
    }
  },

  // Get all labs for selection
  async getAllLabs() {
    try {
      const labsRef = collection(db, 'labs');
      const snapshot = await getDocs(labsRef);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching labs:', error);
      return [];
    }
  },

  // Get lab details by ID
  async getLabDetails(labId: string) {
    try {
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

  // Register new patient (self-registration)
  async registerPatient(labId: string, patientData: any) {
    try {
      const patientsRef = collection(db, 'labs', labId, 'patients');
      
      // Generate unique patient ID
      const timestamp = Date.now().toString().slice(-6);
      const patientId = `PT-${timestamp}`;
      
      const newPatient = {
        ...patientData,
        patientId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
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