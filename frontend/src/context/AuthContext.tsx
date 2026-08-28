import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ThemeMode } from '../types';
import { apiRequest } from '../lib/api';
import { useTheme } from './ThemeContext';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setTheme } = useTheme();

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('habitquest_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const userData = await apiRequest<User>('/auth/me');
      setUser(userData);
      if (userData.settings?.theme) {
        setTheme(userData.settings.theme as ThemeMode);
      }
    } catch {
      localStorage.removeItem('habitquest_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('habitquest_token', token);
    setUser(userData);
    if (userData.settings?.theme) {
      setTheme(userData.settings.theme as ThemeMode);
    }
  };

  const logout = () => {
    localStorage.removeItem('habitquest_token');
    setUser(null);
  };

  const updateUser = (updated: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updated });
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
