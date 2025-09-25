'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define simple placeholder components for SignIn/SignUp so pages can render without Stack Auth
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
  // Replace Stack Auth component types with generic React.FC placeholders
  signInComponent: React.FC;
  signUpComponent: React.FC;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  // Without Stack Auth configured, expose null user
  const user: User | null = null;

  // No-op methods to keep API stable
  const signIn = async (email: string, password: string) => {
    console.log('Sign in (no-op):', email);
  };

  const signOut = async () => {
    console.log('Sign out (no-op)');
  };

  const signUp = async (email: string, password: string, name: string) => {
    console.log('Sign up (no-op):', email, name);
  };

  const value = {
    user,
    isLoading,
    signIn,
    signOut,
    signUp,
    // Provide placeholders; when Stack Auth is re-enabled, swap these with real components
    signInComponent: PlaceholderSignIn,
    signUpComponent: PlaceholderSignUp,
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