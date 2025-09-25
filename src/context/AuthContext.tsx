'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { StackSignIn, StackSignUp } from '@/components/StackAuthClient';

// Remove previous runtime/dynamic placeholder logic and keep simple wiring
// Define simple placeholder components in case something goes wrong
const PlaceholderSignIn: React.FC = () => (
  <div className="text-white/80">
    <p>Authentication is not configured. Set NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY to enable Stack Auth.</p>
  </div>
);

const PlaceholderSignUp: React.FC = () => (
  <div className="text-white/80">
    <p>Authentication is not configured. Set NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY to enable Stack Auth.</p>
  </div>
);

interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  // Use runtime-aware components
  signInComponent: React.FC;
  signUpComponent: React.FC;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading] = useState(false);
  const user: User | null = null;

  const signIn = async (email: string, _password: string) => {
    console.log('Sign in (no-op):', email);
  };
  const signOut = async () => {
    console.log('Sign out (no-op)');
  };
  const signUp = async (email: string, _password: string, name: string) => {
    console.log('Sign up (no-op):', email, name);
  };

  const value = {
    user,
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