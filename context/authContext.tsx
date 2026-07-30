import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface AuthContextType {
  user: any;
  hospital: any;
  hospitals: any[];
  loading: boolean;
  selectHospital: (hospital: any) => void;
  checkAccessCode: (code: string) => Promise<{ success: boolean; user?: any; role?: string; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [hospital, setHospital] = useState<any>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch hospitals on mount
  useEffect(() => {
    const fetchHospitals = async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, 'hospitals'));
      setHospitals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchHospitals();
  }, []);

  const selectHospital = (hosp: any) => setHospital(hosp);

  // Check access code for staff, patient, or superadmin
// context/authContext.tsx - Update checkAccessCode
const checkAccessCode = async (code: string) => {
  setLoading(true);
  try {
    // 1. Check superadmin
    const superAdminRef = doc(db, 'superAdmin', 'superAdminId');
    const superAdminDoc = await getDoc(superAdminRef);
    
  if (superAdminDoc.exists() && superAdminDoc.data().accessCode === code) {
      const superAdmin = superAdminDoc.data();
      const userData = { 
        ...superAdmin, 
        id: superAdminDoc.id, 
        role: 'superadmin',
        roles: ['superadmin'], // Add roles array for consistency
        primaryRole: 'superadmin'
      };
      setUser(userData);
      return { 
        success: true, 
        user: userData, 
        role: 'superadmin',
        roles: ['superadmin'],
        primaryRole: 'superadmin',
        id: superAdminDoc.id,
        name: superAdmin.name || 'Super Admin'
      };
    }

    // 2. Check all hospitals for staff/patient
    const hospitalsSnap = await getDocs(collection(db, 'hospitals'));
    
    for (const hospitalDoc of hospitalsSnap.docs) {
      const hospitalId = hospitalDoc.id;
      const hospitalName = hospitalDoc.data().name;

      // Check staff
      const staffSnap = await getDocs(collection(db, `hospitals/${hospitalId}/staffs`));
      for (const staffDoc of staffSnap.docs) {
        const staff = staffDoc.data();
       // In checkAccessCode function:
if (staff.accessCode === code || staff.code === code) {
  const userRoles = Array.isArray(staff.roles) ? staff.roles : [staff.role].filter(Boolean);
  const userData = { 
    ...staff, 
    id: staffDoc.id, 
    hospitalId, 
    hospitalName, 
    role: userRoles[0],
    roles: userRoles,
    primaryRole: userRoles[0]
  };
  setUser(userData);
  return { 
    success: true, 
    user: userData,
    role: userRoles[0],
    roles: userRoles,
    primaryRole: userRoles[0],
    id: staffDoc.id,
    hospitalId,
    hospitalName,
    name: staff.name || staff.fullName || staff.username || 'User'
  };
}
      }

      // Check patients
      const patientSnap = await getDocs(collection(db, `hospitals/${hospitalId}/patients`));
      for (const patientDoc of patientSnap.docs) {
        const patient = patientDoc.data();
        if (patient.accessCode === code) {
          const userData = { 
            ...patient, 
            id: patientDoc.id, 
            hospitalId, 
            hospitalName, 
            role: 'patient',
            roles: ['patient'],
            primaryRole: 'patient'
          };
          setUser(userData);
          return { 
            success: true, 
            user: userData,
            role: 'patient',
            roles: ['patient'],
            primaryRole: 'patient',
            id: patientDoc.id,
            hospitalId,
            hospitalName,
            name: patient.name || patient.fullName || 'Patient'
          };
        }
      }
    }

    return { success: false, error: 'Invalid access code' };
  } catch (error) {
    console.error('Error checking access code:', error);
    return { success: false, error: 'Network error. Please try again.' };
  } finally {
    setLoading(false);
  }
};
  const logout = () => {
    setUser(null);
    setHospital(null);
  };

  return (
    <AuthContext.Provider value={{ user, hospital, hospitals, loading, selectHospital, checkAccessCode, logout }}>
      {children}
    </AuthContext.Provider>
  );
};