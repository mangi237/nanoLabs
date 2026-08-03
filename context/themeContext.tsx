import React, { createContext, useContext, useState } from 'react';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  accentTeal: string;
  accentBlue: string;
  success: string;
  warning: string;
  danger: string;
}

interface ThemeContextType {
  primaryColor: string;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

const defaultColors: ThemeColors = {
  primary: '#0D9488', // Teal 600
  secondary: '#2563EB', // Blue 600
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  accentTeal: '#14B8A6',
  accentBlue: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
};

const ThemeContext = createContext<ThemeContextType>({
  primaryColor: '#0D9488',
  colors: defaultColors,
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const colors = isDark ? {
    ...defaultColors,
    background: '#0F172A',
    surface: '#1E293B',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#334155'
  } : defaultColors;

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ primaryColor: colors.primary, colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
