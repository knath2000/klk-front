'use client';

import React from 'react';
import { StackProvider, StackClientApp, SignIn, SignUp } from '@stackframe/react';

type CommonProps = {
  publishableKey?: string;
};

function BaseAuth({ mode, publishableKey }: { mode: 'signin' | 'signup' } & CommonProps) {
  // Use direct, static references so Next/Vercel inlines at build time
  const key =
    publishableKey ||
    process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY ||
    (typeof window !== 'undefined' ? (window as any).NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY : '');

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