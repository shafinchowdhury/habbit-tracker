import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeMode } from '../types';
import { apiRequest } from '../lib/api';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEMES: ThemeMode[] = ['clarity', 'midnight', 'fresh', 'harvest'];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('habitquest_theme') as ThemeMode;
    if (saved && THEMES.includes(saved)) {
      return saved;
    }
    return 'clarity';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('habitquest_theme', theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    // sync with backend if user is logged in
    const token = localStorage.getItem('habitquest_token');
    if (token) {
      apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify({ theme: newTheme }),
      }).catch(() => {});
    }
  };

  const cycleTheme = () => {
    const currentIndex = THEMES.indexOf(theme);
    const nextTheme = THEMES[(currentIndex + 1) % THEMES.length];
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
