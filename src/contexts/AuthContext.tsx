"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  updateUserRole as authUpdateUserRole,
  updateUserPermissions as authUpdateUserPermissions,
  onAuthStateChange,
} from '@/lib/firebase/auth';
import type { User, AuthContextType, UserRole } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const user = await authSignIn(email, password);
      setUser(user);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, role: UserRole = 'user'): Promise<void> => {
    setLoading(true);
    try {
      const user = await authSignUp(email, password, role);
      setUser(user);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      await authSignOut();
      setUser(null);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
    try {
      await authUpdateUserRole(userId, role);
      // If updating current user, refresh the user data
      if (user && user.uid === userId) {
        // The onAuthStateChange will automatically update the user
      }
    } catch (error) {
      throw error;
    }
  };

  const updateUserPermissions = async (userId: string, allowedPages: string[]): Promise<void> => {
    try {
      await authUpdateUserPermissions(userId, allowedPages);
      // If updating current user, refresh the user data
      if (user && user.uid === userId) {
        // The onAuthStateChange will automatically update the user
      }
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateUserRole,
    updateUserPermissions,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;