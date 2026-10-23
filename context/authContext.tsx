// context/authContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authService } from '../services/authService';
import errorHandler from '../utils/errorHandler';
import { ensureFirebaseAuth } from '../services/firebase';
import { getActiveLabLogo, setActiveLabLogo } from '../utils/labBranding';

// Keys older versions saved to browser storage. They are removed on every startup.
const LEGACY_KEYS = ['user', 'lab', 'lastLogin', 'accessCode', 'labId'];

const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours, in memory only

interface AuthContextType {
  user: any;
  currentUser: any;
  lab: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessCode: string, labId: string) => Promise<any>;
  loginDoctor: (phoneOrIdentifier: string, passwordOrCode: string) => Promise<any>;
  loginPatient: (phoneOrIdentifier: string, passwordOrCode: string, targetLabId?: string) => Promise<any>;
  logout: () => Promise<void>;
  hasRole: (roleOrRoles: string | string[]) => boolean;
  refresh: () => Promise<void>;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<any>(null);
  const [lab, setLabState] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Held in memory only. Never written to browser storage.
  const credentialsRef = useRef<{ code?: string; labId?: string }>({});
  const loginAtRef = useRef<number>(0);

  // Startup: remove anything saved by older versions, then start signed out.
  useEffect(() => {
    try {
      LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {}

    (async () => {
      try {
        await ensureFirebaseAuth();
      } catch (e) {
        console.error('Firebase auth setup failed:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Sign out automatically after the session timeout
  useEffect(() => {
    const interval = setInterval(() => {
      if (loginAtRef.current && Date.now() - loginAtRef.current > SESSION_TIMEOUT) {
        clearSession();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const setUser = (newUser: any) => {
    setUserState(newUser);
    setIsAuthenticated(!!newUser);
    if (!newUser) loginAtRef.current = 0;
  };

  const setLab = (newLab: any) => {
    if (!newLab) {
      setLabState(null);
      return;
    }
    let labToSave = newLab;
    const activeLogo = getActiveLabLogo(newLab) || newLab.logoUrl;
    if (newLab.logoUrl) {
      setActiveLabLogo(newLab.logoUrl, newLab.id);
    } else if (activeLogo) {
      labToSave = { ...newLab, logoUrl: activeLogo };
    }
    setLabState(labToSave);
  };

  const startSession = (sessionUser: any, sessionLab: any) => {
    setUserState(sessionUser);
    setLab(sessionLab);
    setIsAuthenticated(true);
    loginAtRef.current = Date.now();
  };

  const login = async (accessCode: string, labId: string) => {
    try {
      const result = await authService.verifyAccessCode(accessCode, labId);
      if (result.success && result.user) {
        if (result.user.role === 'patient') {
          throw new Error('Invalid Staff Access Code. Patient codes cannot authenticate on the Laboratory Staff portal.');
        }
        credentialsRef.current = { code: accessCode, labId };
        startSession(result.user, result.lab);
        return result;
      }
      throw new Error(result.error || 'Invalid credentials');
    } catch (error: any) {
      errorHandler.handleError(error);
      throw error;
    }
  };

  const loginDoctor = async (phoneOrIdentifier: string, passwordOrCode: string) => {
    try {
      const result = await authService.loginDoctor(phoneOrIdentifier, passwordOrCode);
      if (result.success && result.user) {
        credentialsRef.current = { code: passwordOrCode, labId: 'network-doctors' };
        startSession(result.user, result.lab);
        return result;
      }
      throw new Error(result.error || 'Doctor authentication failed');
    } catch (error: any) {
      errorHandler.handleError(error);
      throw error;
    }
  };

  const loginPatient = async (phoneOrIdentifier: string, passwordOrCode: string, targetLabId?: string) => {
    try {
      const result = await authService.loginPatient(phoneOrIdentifier, passwordOrCode, );
      if (result.success && result.user) {
        credentialsRef.current = { code: passwordOrCode, labId: result.lab?.id || targetLabId || 'lab-1' };
        startSession(result.user, result.lab);
        return result;
      }
      throw new Error(result.error || 'Patient authentication failed');
    } catch (error: any) {
      errorHandler.handleError(error);
      throw error;
    }
  };

  const clearSession = async () => {
    credentialsRef.current = {};
    setUserState(null);
    setLabState(null);
    setIsAuthenticated(false);
    loginAtRef.current = 0;
    try {
      LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {}
  };

  const logout = async () => {
    await clearSession();
  };

  const refreshToken = async () => {
    const { code, labId } = credentialsRef.current;
    if (code && labId) {
      await login(code, labId);
    }
  };

  const registerPatient = async (labId: string, data: any) => authService.registerPatient(labId, data);
  const getAllLabs = async () => authService.getAllLabs();
  const getLabDetails = async (labId: string) => authService.getLabDetails(labId);
  const createStaffWithCode = async (staffData: any, adminUser?: any) =>
    authService.createStaffWithCode(staffData, adminUser);
  const resetStaffAccessCode = async (
    staffId: string,
    email: string,
    newAccessCode: string,
    labId?: string,
    adminUser?: any
  ) => authService.resetStaffAccessCode(staffId, email, newAccessCode, labId, adminUser);
  const verifyAccessCode = async (code: string, labId: string) => authService.verifyAccessCode(code, labId);
  const verifyStaffActionCode = async (inputCode: string, allowedRoles: string[], currentUserCode?: string) =>
    authService.verifyStaffActionCode(inputCode, allowedRoles, currentUserCode);

  const hasRole = (roleOrRoles: string | string[]): boolean => {
    if (!user) return false;
    const currentRoles: string[] = user.roles || (user.role ? [user.role] : []);
    if (Array.isArray(roleOrRoles)) {
      return roleOrRoles.some((r) => currentRoles.includes(r));
    }
    return currentRoles.includes(roleOrRoles);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser: user,
        lab,
        isAuthenticated,
        isLoading,
        login,
        loginDoctor,
        loginPatient,
        logout,
        hasRole,
        refresh: refreshToken,
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
        verifyStaffActionCode,
      }}
    >
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