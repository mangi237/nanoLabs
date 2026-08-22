// context/authContext.tsx - ENHANCED SECURITY (Web Compatible)
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import errorHandler from '../utils/errorHandler';
import { ensureFirebaseAuth } from '../services/firebase';

// Web localStorage adapter providing standard AsyncStorage API (getItem, setItem, multiRemove)
const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  multiRemove: async (keys: string[]): Promise<void> => {
    try {
      keys.forEach(k => localStorage.removeItem(k));
    } catch {}
  }
};

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
  refreshToken: () => Promise<void>;
  clearSession: () => Promise<void>;
  setUser: (user: any) => void;
  setLab: (lab: any) => void;
  createStaffWithCode: (staffData: any, adminUser?: any) => Promise<any>;
  resetStaffAccessCode: (staffId: string, email: string, newAccessCode: string, labId?: string, adminUser?: any) => Promise<any>;
  verifyAccessCode: (code: string, labId: string) => Promise<any>;
  verifyStaffActionCode: (inputCode: string, allowedRoles: string[], currentUserCode?: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [lab, setLab] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
    
    // Auto logout on session timeout
    const interval = setInterval(async () => {
      const lastLogin = await AsyncStorage.getItem('lastLogin');
      if (lastLogin) {
        const elapsed = Date.now() - parseInt(lastLogin);
        if (elapsed > SESSION_TIMEOUT) {
          await clearSession();
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const checkAuthStatus = async () => {
    try {
      await ensureFirebaseAuth();
      const storedUser = await AsyncStorage.getItem('user');
      const storedLab = await AsyncStorage.getItem('lab');
      const lastLogin = await AsyncStorage.getItem('lastLogin');
      
      // Check session timeout
      if (lastLogin) {
        const elapsed = Date.now() - parseInt(lastLogin);
        if (elapsed > SESSION_TIMEOUT) {
          await clearSession();
          return;
        }
      }
      
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

  const login = async (accessCode: string, labId: string) => {
    try {
      const result = await authService.verifyAccessCode(accessCode, labId);
      
      if (result.success) {
        setUser(result.user);
        setLab(result.lab);
        setIsAuthenticated(true);
        
        // Store session data
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        if (result.lab) {
          await AsyncStorage.setItem('lab', JSON.stringify(result.lab));
        }
        await AsyncStorage.setItem('lastLogin', String(Date.now()));
        await AsyncStorage.setItem('accessCode', accessCode);
        await AsyncStorage.setItem('labId', labId || '');
        
        return result;
      } else {
        throw new Error(result.error || 'Invalid credentials');
      }
    } catch (error: any) {
      errorHandler.handleError(error);
      throw error;
    }
  };

  const logout = async () => {
    await clearSession();
  };

  const clearSession = async () => {
    setUser(null);
    setLab(null);
    setIsAuthenticated(false);
    await AsyncStorage.multiRemove(['user', 'lab', 'lastLogin', 'accessCode', 'labId']);
  };

  const refreshToken = async () => {
    const accessCode = await AsyncStorage.getItem('accessCode');
    const labId = await AsyncStorage.getItem('labId');
    if (accessCode && labId) {
      await login(accessCode, labId);
    }
  };

  const registerPatient = async (labId: string, data: any) => {
    return await authService.registerPatient(labId, data);
  };

  const getAllLabs = async () => {
    return await authService.getAllLabs();
  };

  const getLabDetails = async (labId: string) => {
    return await authService.getLabDetails(labId);
  };

  const createStaffWithCode = async (staffData: any, adminUser?: any) => {
    return await authService.createStaffWithCode(staffData, adminUser);
  };

  const resetStaffAccessCode = async (staffId: string, email: string, newAccessCode: string, labId?: string, adminUser?: any) => {
    return await authService.resetStaffAccessCode(staffId, email, newAccessCode, labId, adminUser);
  };

  const verifyAccessCode = async (code: string, labId: string) => {
    return await authService.verifyAccessCode(code, labId);
  };

  const verifyStaffActionCode = async (inputCode: string, allowedRoles: string[], currentUserCode?: string) => {
    return await authService.verifyStaffActionCode(inputCode, allowedRoles, currentUserCode);
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
      refreshToken,
      clearSession,
      setUser,
      setLab,
      createStaffWithCode,
      resetStaffAccessCode,
      verifyAccessCode,
      verifyStaffActionCode
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
