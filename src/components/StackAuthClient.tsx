'use client';

import React from 'react';
import { StackProvider, StackClientApp, SignIn, SignUp } from '@stackframe/react';

// Declare typed window property to avoid any-casts
declare global {
  interface Window {
    NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY?: string;
    NEXT_PUBLIC_STACK_PROJECT_ID?: string;
  }
}

type CommonProps = {
  publishableKey?: string;
};

function BaseAuth({ mode, publishableKey }: { mode: 'signin' | 'signup' } & CommonProps) {
  // Use direct, static references so Next/Vercel inlines at build time and fallback to typed window runtime.
  const runtimeKey = typeof window !== 'undefined' ? window.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY : undefined;
  const runtimeProject = typeof window !== 'undefined' ? window.NEXT_PUBLIC_STACK_PROJECT_ID : undefined;
  const key =
    publishableKey ||
    process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY ||
    runtimeKey ||
    '';
  const projectId =
    process.env.NEXT_PUBLIC_STACK_PROJECT_ID ||
    runtimeProject ||
    '';

  if (!key) {
    return (
      <div className="text-white/80">
        <p>Authentication is not configured. Set NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY to enable Stack Auth.</p>
      </div>
    );
  }

  // Client-side Stack app instance
  const app = new StackClientApp({
    tokenStore: 'memory',
    publishableClientKey: key,
    projectId,
  });

  return (
    <StackProvider app={app}>
      {mode === 'signin' ? <SignIn /> : <SignUp />}
    </StackProvider>
  );
}

export function StackSignIn(props: CommonProps) {
  return <BaseAuth mode="signin" {...props} />;
}

export function StackSignUp(props: CommonProps) {
  return <BaseAuth mode="signup" {...props} />;
}