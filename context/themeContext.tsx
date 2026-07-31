import React, { createContext, useContext, useState } from 'react';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  success: string;
  error: string;
  warning: string;
  info: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  setTheme: (colors: Partial<ThemeColors>) => void;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

const defaultTheme: ThemeColors = {
  primary: '#1A237E',
  secondary: '#E91E63',
  accent: '#F1C40F',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#1A237E',
  textSecondary: '#666666',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colors, setColors] = useState<ThemeColors>(defaultTheme);

  const setTheme = (newColors: Partial<ThemeColors>) => {
    setColors(prev => ({ ...prev, ...newColors }));
  };

  const value = {
    colors,
    setTheme,
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    accentColor: colors.accent,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};