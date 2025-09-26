'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StackSignIn, StackSignUp } from '@/components/StackAuthClient';
import { getNeonAuthToken } from '@/lib/neonAuth';

interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password?: string, name?: string) => Promise<void>;
  signInComponent: React.FC;
  signUpComponent: React.FC;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Bridge: detect Stack Auth token on the client and reflect it into our header state
  useEffect(() => {
    let cancelled = false;
    let tries = 0;
    const interval = window.setInterval(() => {
      tries += 1;
      // Poll up to ~5 seconds total
      if (tries >= 4) {
        window.clearInterval(interval);
        setIsLoading(false);
        return;
      }
      void syncFromStack();
    }, 1200);

    const syncFromStack = async () => {
      try {
        const token = await getNeonAuthToken();
        if (cancelled) return;

        if (token && !user) {
          // We don't have profile fields without using the SDK; present a generic signed-in identity
          setUser({
            id: 'stack-auth-user',
            email: '',
            name: 'Account',
          });
          // Once set, stop polling
          window.clearInterval(interval);
        } else if (!token && user) {
          // Token disappeared; reflect signed-out state
          setUser(null);
        }
      } catch {
        // Ignore transient errors
      } finally {
        setIsLoading(false);
      }
    };

    // Quick burst polling for first few seconds after navigation from SignIn/SignUp
    setIsLoading(true);
    syncFromStack();

    // Also resync on visibility changes (e.g., after redirect back)
    const onVisible = () => void syncFromStack();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user]);

  const signIn = async (email: string, password?: string) => {
    void password; // prevent unused param warning without logging
    console.log('Sign in (no-op):', email);
  };

  const signOut = async () => {
    console.log('Sign out (no-op)');
    // Soft sign-out locally; tokens (if any) remain and bridge will restore on next load
    setUser(null);
  };

  const signUp = async (email: string, password?: string, name?: string) => {
    void password;
    void name;
    console.log('Sign up (no-op):', email);
  };

  const value = {
    user,
    setUser,
    isLoading,
    signIn,
    signOut,
    signUp,
    // Always use client-only wrappers; they internally show a placeholder only if the key is truly missing
    signInComponent: StackSignIn,
    signUpComponent: StackSignUp,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}