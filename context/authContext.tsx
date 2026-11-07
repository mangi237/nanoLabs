// context/authContext.tsx - Persistent Firestore-Backed Session (Zero Timeout / Zero Loading Bounce)
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import errorHandler from '../utils/errorHandler';
import { db, doc, getDoc, ensureFirebaseAuth } from '../services/firebase';
import { getActiveLabLogo, setActiveLabLogo } from '../utils/labBranding';

const SESSION_USER_KEY = 'nanolabs_session_user_v3';
const SESSION_LAB_KEY = 'nanolabs_session_lab_v3';

function readInitialSessionUser(): any | null {
  try {
    if (typeof window === 'undefined') return null;
    // Always purge localStorage user tokens to prevent auto-login across app entries
    try {
      window.localStorage.removeItem(SESSION_USER_KEY);
      window.localStorage.removeItem('user');
    } catch {}

    // Only allow active in-tab session if explicitly active during this browsing session
    const raw = window.sessionStorage.getItem(SESSION_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readInitialSessionLab(): any | null {
  try {
    if (typeof window === 'undefined') return null;
    try {
      window.localStorage.removeItem(SESSION_LAB_KEY);
      window.localStorage.removeItem('lab');
    } catch {}
    const raw = window.sessionStorage.getItem(SESSION_LAB_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistSessionUser(val: any | null) {
  try {
    if (typeof window === 'undefined') return;
    if (val) {
      const serialized = JSON.stringify(val);
      window.sessionStorage.setItem(SESSION_USER_KEY, serialized);
    } else {
      window.sessionStorage.removeItem(SESSION_USER_KEY);
      window.localStorage.removeItem(SESSION_USER_KEY);
      window.localStorage.removeItem('user');
    }
  } catch {}
}

function persistSessionLab(val: any | null) {
  try {
    if (typeof window === 'undefined') return;
    if (val) {
      const serialized = JSON.stringify(val);
      window.sessionStorage.setItem(SESSION_LAB_KEY, serialized);
    } else {
      window.sessionStorage.removeItem(SESSION_LAB_KEY);
      window.localStorage.removeItem(SESSION_LAB_KEY);
      window.localStorage.removeItem('lab');
    }
  } catch {}
}

interface AuthContextType {
  user: any;
  currentUser: any;
  lab: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessCode?: string, labId?: string) => Promise<any>;
  loginDoctor: (phoneOrIdentifier: string, passwordOrCode: string) => Promise<any>;
  loginPatient: (phoneOrIdentifier: string, passwordOrCode: string, targetLabId?: string) => Promise<any>;
  logout: () => void;
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
  resetStaffAccessCode: (
    staffId: string,
    email: string,
    newAccessCode: string,
    labId?: string,
    adminUser?: any
  ) => Promise<any>;
  verifyAccessCode: (code?: string, labId?: string) => Promise<any>;
  verifyStaffActionCode: (
    inputCode: string,
    allowedRoles: string[],
    currentUserCode?: string,
    labId?: string
  ) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(() => readInitialSessionUser());
  const [lab, setLab] = useState<any>(() => readInitialSessionLab());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    Boolean(readInitialSessionUser())
  );
  // Instant synchronous hydration: never block UI with a loading spinner or auto-expire active sessions
  const [isLoading] = useState<boolean>(false);

  const setUserWithPersistence = (newUser: any) => {
    setUser(newUser);
    if (newUser) {
      setIsAuthenticated(true);
      persistSessionUser(newUser);
    } else {
      setIsAuthenticated(false);
      persistSessionUser(null);
    }
  };

  const setLabWithPersistence = (newLab: any) => {
    if (newLab) {
      const activeLogo = getActiveLabLogo(newLab) || newLab.logoUrl;
      let labToSave = newLab;
      if (newLab.logoUrl && newLab.id) {
        setActiveLabLogo(newLab.logoUrl, newLab.id);
      } else if (activeLogo) {
        labToSave = { ...newLab, logoUrl: activeLogo };
      }
      setLab(labToSave);
      persistSessionLab(labToSave);
    } else {
      setLab(null);
      persistSessionLab(null);
    }
  };

  // Silent background sync with Firestore so user/lab profile stays fresh without ever resetting or timing out
  useEffect(() => {
    let active = true;
    const syncLiveFirestoreIdentity = async () => {
      try {
        await ensureFirebaseAuth();
        if (!user?.id) return;

        if (user.role === 'patient') {
          const patSnap = await getDoc(doc(db, 'patients', user.id)).catch(() => null);
          if (active && patSnap && patSnap.exists()) {
            const fresh = patSnap.data();
            const merged = {
              ...user,
              ...fresh,
              id: patSnap.id,
              role: 'patient',
              roles: ['patient'],
            };
            delete merged.passwordHash;
            delete merged.passwordSalt;
            setUserWithPersistence(merged);

            if (merged.labId) {
              const freshLab: any = await authService.getLabDetails(merged.labId);
              if (active && freshLab?.name) {
                setLabWithPersistence(freshLab);
              }
            }
          }
        } else if (user.role === 'doctor') {
          const docSnap = await getDoc(doc(db, 'doctors', user.id)).catch(() => null);
          if (active && docSnap && docSnap.exists()) {
            const fresh = docSnap.data();
            const merged = {
              ...user,
              ...fresh,
              id: docSnap.id,
              role: 'doctor',
              roles: ['doctor'],
            };
            delete merged.password;
            delete merged.passwordHash;
            delete merged.passwordSalt;
            setUserWithPersistence(merged);
          }
        } else if (
          lab?.id &&
          lab.id !== 'global-network' &&
          lab.id !== 'network-doctors'
        ) {
          const freshLab: any = await authService.getLabDetails(lab.id);
          if (active && freshLab?.name) {
            setLabWithPersistence({ ...lab, ...freshLab });
          }
        }
      } catch (err) {
        console.warn('Silent session sync notice:', err);
      }
    };

    syncLiveFirestoreIdentity();
    return () => {
      active = false;
    };
  }, [user?.id, user?.role]);

  const login = async (accessCode: string = '', labId: string = '') => {
    try {
      const cleanAccessCode = (accessCode || '').trim();
      const cleanLabId = (labId || '').trim();
      const result = await authService.verifyAccessCode(cleanAccessCode, cleanLabId);

      if (result.success && result.user) {
        if (result.user.role === 'patient') {
          throw new Error(
            'Invalid Staff Access Code. Patient codes cannot authenticate on the Laboratory Staff portal.'
          );
        }
        setUserWithPersistence(result.user);
        setLabWithPersistence(result.lab || null);
        return result;
      } else {
        throw new Error(result.error || 'Invalid credentials');
      }
    } catch (error: any) {
      errorHandler.handleError(error);
      throw error;
    }
  };

  const loginDoctor = async (phoneOrIdentifier: string = '', passwordOrCode: string = '') => {
    try {
      const result = await authService.loginDoctor(phoneOrIdentifier, passwordOrCode);

      if (result.success && result.user) {
        setUserWithPersistence(result.user);
        setLabWithPersistence(result.lab || null);
        return result;
      } else {
        throw new Error(result.error || 'Doctor authentication failed');
      }
    } catch (error: any) {
      errorHandler.handleError(error);
      throw error;
    }
  };

  const loginPatient = async (
    phoneOrIdentifier: string = '',
    passwordOrCode: string = '',
    targetLabId?: string
  ) => {
    try {
      const result = await authService.loginPatient(
        phoneOrIdentifier,
        passwordOrCode,
        targetLabId
      );

      if (result.success && result.user) {
        setUserWithPersistence(result.user);
        setLabWithPersistence(result.lab || null);
        return result;
      } else {
        throw new Error(result.error || 'Patient authentication failed');
      }
    } catch (error: any) {
      errorHandler.handleError(error);
      throw error;
    }
  };

  const clearSession = async () => {
    setUserWithPersistence(null);
    setLabWithPersistence(null);
  };

  const logout = () => {
    clearSession();
  };

  const refreshToken = async () => {
    await ensureFirebaseAuth();
  };

  const registerPatient = async (labId: string = '', data: any = {}) => {
    return await authService.registerPatient(labId, data);
  };

  const getAllLabs = async () => {
    return await authService.getAllLabs();
  };

  const getLabDetails = async (labId: string = '') => {
    return await authService.getLabDetails(labId);
  };

  const createStaffWithCode = async (staffData: any, adminUser?: any) => {
    return await authService.createStaffWithCode(staffData, adminUser);
  };

  const resetStaffAccessCode = async (
    staffId: string = '',
    email: string = '',
    newAccessCode: string = '',
    labId?: string,
    adminUser?: any
  ) => {
    return await authService.resetStaffAccessCode(
      staffId,
      email,
      newAccessCode,
      labId,
      adminUser
    );
  };

  const verifyAccessCode = async (code: string = '', labId: string = '') => {
    return await authService.verifyAccessCode(code, labId);
  };

  const verifyStaffActionCode = async (
    inputCode: string = '',
    allowedRoles: string[] = [],
    currentUserCode?: string,
    targetLabId?: string
  ) => {
    return await authService.verifyStaffActionCode(
      inputCode,
      allowedRoles,
      currentUserCode,
      targetLabId
    );
  };

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
        setUser: setUserWithPersistence,
        setLab: setLabWithPersistence,
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
