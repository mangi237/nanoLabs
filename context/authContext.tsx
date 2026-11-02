// context/authContext.tsx - ENHANCED SECURITY (Web Compatible)
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import errorHandler from '../utils/errorHandler';
import { ensureFirebaseAuth } from '../services/firebase';
import { getActiveLabLogo, setActiveLabLogo } from '../utils/labBranding';

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
  currentUser: any;
  lab: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessCode: string, labId: string) => Promise<any>;
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
  resetStaffAccessCode: (staffId: string, email: string, newAccessCode: string, labId?: string, adminUser?: any) => Promise<any>;
  verifyAccessCode: (code: string, labId: string) => Promise<any>;
  verifyStaffActionCode: (inputCode: string, allowedRoles: string[], currentUserCode?: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30 days persistent clinical session

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [lab, setLab] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();

    // Refresh lastLogin timestamp when user interacts with the app (throttled to every 5 minutes)
    let lastTouch = 0;
    const touchSession = () => {
      const now = Date.now();
      if (now - lastTouch > 5 * 60 * 1000) {
        lastTouch = now;
        try {
          if (localStorage.getItem('user')) {
            localStorage.setItem('lastLogin', String(now));
          }
        } catch {}
      }
    };
    window.addEventListener('pointerdown', touchSession, { passive: true });
    window.addEventListener('keydown', touchSession, { passive: true });

    // Auto logout only after full 30-day inactivity window
    const interval = setInterval(async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) return;
      const lastLogin = await AsyncStorage.getItem('lastLogin');
      if (lastLogin) {
        const parsedTs = parseInt(lastLogin, 10);
        if (Number.isFinite(parsedTs)) {
          const elapsed = Date.now() - parsedTs;
          if (elapsed > SESSION_TIMEOUT) {
            await clearSession();
          }
        } else {
          await AsyncStorage.setItem('lastLogin', String(Date.now()));
        }
      } else {
        await AsyncStorage.setItem('lastLogin', String(Date.now()));
      }
    }, 60000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pointerdown', touchSession);
      window.removeEventListener('keydown', touchSession);
    };
  }, []);

  const setUserWithPersistence = (newUser: any) => {
    setUser(newUser);
    if (newUser) {
      setIsAuthenticated(true);
      AsyncStorage.setItem('user', JSON.stringify(newUser));
      AsyncStorage.setItem('lastLogin', String(Date.now()));
    } else {
      setIsAuthenticated(false);
      localStorage.removeItem('user');
    }
  };

  const setLabWithPersistence = (newLab: any) => {
    let labToSave = newLab;
    if (newLab) {
      const activeLogo = getActiveLabLogo(newLab) || newLab.logoUrl;
      if (newLab.logoUrl) {
        setActiveLabLogo(newLab.logoUrl, newLab.id);
      } else if (activeLogo) {
        labToSave = { ...newLab, logoUrl: activeLogo };
      }
      setLab(labToSave);
      AsyncStorage.setItem('lab', JSON.stringify(labToSave));
      try {
        localStorage.setItem('lab', JSON.stringify(labToSave));
      } catch {}
    } else {
      setLab(null);
      localStorage.removeItem('lab');
    }
  };

  const checkAuthStatus = async () => {
    try {
      await ensureFirebaseAuth();
      const storedUser = await AsyncStorage.getItem('user');
      const storedLab = await AsyncStorage.getItem('lab');
      const lastLogin = await AsyncStorage.getItem('lastLogin');
      
      // Check session timeout safely
      if (lastLogin) {
        const parsedTs = parseInt(lastLogin, 10);
        if (Number.isFinite(parsedTs)) {
          const elapsed = Date.now() - parsedTs;
          if (elapsed > SESSION_TIMEOUT) {
            await clearSession();
            return;
          }
        }
      }
      
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        let parsedLab = storedLab ? JSON.parse(storedLab) : null;
        
        if (!parsedLab && parsedUser?.labId) {
          parsedLab = { id: parsedUser.labId, name: parsedUser.labName || 'Laboratory Center' };
        }

        // Refresh live lab metadata (package, mobile phlebotomist opt-in, limits) in background
        if (parsedLab?.id && parsedLab.id !== 'global-network' && parsedLab.id !== 'network-doctors') {
          authService.getLabDetails(parsedLab.id).then((freshLab) => {
            if (freshLab && freshLab.name) {
              setLabWithPersistence({ ...parsedLab, ...freshLab });
            }
          }).catch(() => {});
        }

        if (parsedLab) {
          const cachedLogo = getActiveLabLogo(parsedLab);
          if (cachedLogo) {
            parsedLab.logoUrl = cachedLogo;
          }
          setLab(parsedLab);
        }

        setUser(parsedUser);
        setIsAuthenticated(true);
        await AsyncStorage.setItem('lastLogin', String(Date.now()));
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
      
      if (result.success && result.user) {
        if (result.user.role === 'patient') {
          throw new Error('Invalid Staff Access Code. Patient codes cannot authenticate on the Laboratory Staff portal.');
        }
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

  const loginDoctor = async (phoneOrIdentifier: string, passwordOrCode: string) => {
    try {
      const result = await authService.loginDoctor(phoneOrIdentifier, passwordOrCode);
      
      if (result.success && result.user) {
        setUser(result.user);
        setLab(result.lab);
        setIsAuthenticated(true);
        
        // Store session data
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        if (result.lab) {
          await AsyncStorage.setItem('lab', JSON.stringify(result.lab));
        }
        await AsyncStorage.setItem('lastLogin', String(Date.now()));
        await AsyncStorage.setItem('accessCode', passwordOrCode);
        await AsyncStorage.setItem('labId', 'network-doctors');
        
        return result;
      } else {
        throw new Error(result.error || 'Doctor authentication failed');
      }
    } catch (error: any) {
      errorHandler.handleError(error);
      throw error;
    }
  };

  const loginPatient = async (phoneOrIdentifier: string, passwordOrCode: string, targetLabId?: string) => {
    try {
      const result = await authService.loginPatient(phoneOrIdentifier, passwordOrCode, targetLabId);
      
      if (result.success && result.user) {
        setUser(result.user);
        setLab(result.lab);
        setIsAuthenticated(true);
        
        // Store session data
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        if (result.lab) {
          await AsyncStorage.setItem('lab', JSON.stringify(result.lab));
        }
        await AsyncStorage.setItem('lastLogin', String(Date.now()));
        await AsyncStorage.setItem('accessCode', passwordOrCode);
        await AsyncStorage.setItem('labId', result.lab?.id || targetLabId || 'lab-1');
        
        return result;
      } else {
        throw new Error(result.error || 'Patient authentication failed');
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

  const hasRole = (roleOrRoles: string | string[]): boolean => {
    if (!user) return false;
    const currentRoles: string[] = user.roles || (user.role ? [user.role] : []);
    if (Array.isArray(roleOrRoles)) {
      return roleOrRoles.some((r) => currentRoles.includes(r));
    }
    return currentRoles.includes(roleOrRoles);
  };

  return (
    <AuthContext.Provider value={{
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
