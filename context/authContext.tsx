// context/authContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

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

  const login = async (accessCode: string, labId: string) => {
    try {
      console.log('🔍 Login attempt:', { accessCode, labId });
      
      const result = await authService.verifyAccessCode(accessCode, labId);
      console.log('📦 Login result:', result);
      
      if (result.success) {
        setUser(result.user);
        setLab(result.lab);
        setIsAuthenticated(true);
        
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        if (result.lab) {
          await AsyncStorage.setItem('lab', JSON.stringify(result.lab));
        } else {
          await AsyncStorage.removeItem('lab');
        }
        
        return result;
      } else {
        throw new Error(result.error || 'Invalid credentials');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    setLab(null);
    setIsAuthenticated(false);
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('lab');
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
      getLabDetails
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