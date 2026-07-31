import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import {db}  from '../services/firebase';

interface AuthContextType {
  user: any;
  lab: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessCode: string, labId: string) => Promise<any>;
  logout: () => void;
  registerPatient: (labId: string, data: any) => Promise<any>;
  getAllLabs: () => Promise<any[]>;
  getLabDetails: (labId: string) => Promise<any>;
  confirmPatient: (labId: string, patientId: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [lab, setLab] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const storedLab = await AsyncStorage.getItem('lab');
      
      if (storedUser && storedLab) {
        setUser(JSON.parse(storedUser));
        setLab(JSON.parse(storedLab));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify access code for login
  const login = async (accessCode: string, labId: string) => {
    try {
      // Check if super admin
      if (accessCode === 'SUPER123' || accessCode === 'ADMIN123') {
        const superAdminRef = doc(db, 'superAdmin', 'settings');
        const superAdminDoc = await getDoc(superAdminRef);
        
        if (superAdminDoc.exists()) {
          const data = superAdminDoc.data();
          if (data.accessCode === accessCode) {
            const userData = { 
              id: 'superAdmin', 
              name: 'Super Admin', 
              role: 'superadmin',
              roles: ['superadmin']
            };
            setUser(userData);
            setLab(null);
            setIsAuthenticated(true);
            
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            await AsyncStorage.setItem('lab', JSON.stringify(null));
            
            return { 
              success: true, 
              user: userData, 
              lab: null, 
              role: 'superadmin' 
            };
          }
        }
      }

      // Check staff in lab
      const staffRef = collection(db, 'labs', labId, 'staff');
      const staffQuery = query(staffRef, where('accessCode', '==', accessCode));
      const staffSnapshot = await getDocs(staffQuery);

      if (!staffSnapshot.empty) {
        const staffDoc = staffSnapshot.docs[0];
        const staffData = staffDoc.data();
        
        const userData = {
          id: staffDoc.id,
          ...staffData,
          roles: staffData.roles || [staffData.primaryRole || staffData.role || 'staff']
        };
        
        const labData = { id: labId, name: staffData.labName || 'Lab' };
        
        setUser(userData);
        setLab(labData);
        setIsAuthenticated(true);
        
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('lab', JSON.stringify(labData));
        
        return { 
          success: true, 
          user: userData, 
          lab: labData, 
          role: userData.roles[0] 
        };
      }

      // Check patients in lab
      const patientsRef = collection(db, 'labs', labId, 'patients');
      const patientsQuery = query(patientsRef, where('accessCode', '==', accessCode));
      const patientsSnapshot = await getDocs(patientsQuery);

      if (!patientsSnapshot.empty) {
        const patientDoc = patientsSnapshot.docs[0];
        const patientData = patientDoc.data();
        
        const userData = {
          id: patientDoc.id,
          ...patientData,
          role: 'patient',
          roles: ['patient']
        };
        
        const labData = { id: labId, name: patientData.labName || 'Lab' };
        
        setUser(userData);
        setLab(labData);
        setIsAuthenticated(true);
        
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('lab', JSON.stringify(labData));
        
        return { 
          success: true, 
          user: userData, 
          lab: labData, 
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
  };

  const logout = async () => {
    setUser(null);
    setLab(null);
    setIsAuthenticated(false);
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('lab');
  };

  // Register new patient (self-registration)
  const registerPatient = async (labId: string, patientData: any) => {
    try {
      const patientsRef = collection(db, 'labs', labId, 'patients');
      
      const newPatient = {
        ...patientData,
        status: 'pending', // Waiting for receptionist confirmation
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
  };

  // Get all labs
  const getAllLabs = async () => {
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
  };

  // Get lab details by ID
  const getLabDetails = async (labId: string) => {
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
  };

  // Confirm patient (Receptionist)
  const confirmPatient = async (labId: string, patientId: string) => {
    try {
      const patientRef = doc(db, 'labs', labId, 'patients', patientId);
      await updateDoc(patientRef, {
        status: 'active',
        confirmedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error confirming patient:', error);
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      lab,
      isAuthenticated,
      isLoading,
      login,
      logout,
      registerPatient,
      getAllLabs,
      getLabDetails,
      confirmPatient
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};