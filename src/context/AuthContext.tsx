'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password?: string, name?: string) => Promise<void>;
  updateUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user data from backend API
  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Fetch user error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const signIn = async (email: string, password?: string) => {
    // Stack Auth handles the actual sign in via its UI components
    console.log('Sign in initiated:', email);
    // After sign in, fetch user data from backend
    await fetchUser();
  };

  const signOut = async () => {
    try {
      // Call backend logout endpoint to clear server session
      await fetch('/api/logout', { method: 'POST' });
      // Clear local state
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      // Always clear local state
      setUser(null);
    }
  };

  const signUp = async (email: string, password?: string, name?: string) => {
    // Stack Auth handles the actual sign up via its UI components
    console.log('Sign up initiated:', email, name);
    // After sign up, fetch user data from backend
    await fetchUser();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    signIn,
    signOut,
    signUp,
    updateUser: setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};