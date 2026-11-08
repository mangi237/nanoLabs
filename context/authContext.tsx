import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { authService } from '../services/authService';
import { reportApiError } from '../services/apiClient';
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
  const [user, updateUser] = useState<any>(null);
  const [lab, updateLab] = useState<any>(null);
  const [isLoading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) { updateUser(null); updateLab(null); return; }
    const result = await authService.session(); updateUser(result.user); updateLab(result.lab);
  }, []);
  useEffect(() => onAuthStateChanged(auth, async identity => {
    setLoading(true);
    try {
      if (!identity || identity.isAnonymous) { updateUser(null); updateLab(null); }
      else await refresh();
    } catch (error) { updateUser(null); updateLab(null); reportApiError(error); }
    finally { setLoading(false); }
  }), [refresh]);
  const establish = async (request: Promise<any>) => {
    const result = await request; updateUser(result.user); updateLab(result.lab); return result;
  };
  const logout = () => { void authService.logout().then(() => { updateUser(null); updateLab(null); }).catch(reportApiError); };
  const value: AuthContextType = {
    user, currentUser: user, lab, isAuthenticated: Boolean(user), isLoading,
    login: (password = '', identifier = '') => establish(authService.verifyAccessCode(password, identifier)),
    loginPatient: (identifier, password) => establish(authService.loginPatient(identifier, password)),
    loginDoctor: (identifier, password) => establish(authService.loginDoctor(identifier, password)),
    logout, hasRole: roles => Boolean(user && (Array.isArray(roles) ? roles : [roles]).some(role => user.roles.includes(role))),
    refresh, refreshToken: refresh, clearSession: () => authService.logout(),
    setUser: value => { if (value?.id !== auth.currentUser?.uid) throw new Error('Sign in before opening this account.'); void refresh().catch(reportApiError); },
    setLab: value => { if (value) void authService.getLabDetails(value.id).then(updateLab).catch(reportApiError); else updateLab(null); },
    getAllLabs: useCallback(() => authService.getAllLabs(), []),
    getLabDetails: (id) => authService.getLabDetails(id),
    registerPatient: (id, data) => authService.registerPatient(id, data),
    createStaffWithCode: (data, admin) => authService.createStaffWithCode(data, admin),
    resetStaffAccessCode: (...args) => authService.resetStaffAccessCode(...args),
    verifyAccessCode: (...args) => authService.verifyAccessCode(...args),
    verifyStaffActionCode: (...args) => authService.verifyStaffActionCode(...args)
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth requires AuthProvider.');
  return context;
};
