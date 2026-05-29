"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { goOffline } from '@/lib/presence';

interface User {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  token: string;
  avatar_url?: string;
  job_role?: string;
  projectId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('nexus_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setTimeout(() => {
          setUser(parsed);
          setLoading(false);
        }, 0);
        return;
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }
    setTimeout(() => setLoading(false), 0);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('nexus_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser((prev) => {
      if (prev?.token) goOffline(prev.token);
      return null;
    });
    localStorage.removeItem('nexus_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
