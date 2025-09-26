'use client';

import React from 'react';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { SignIn, SignUp } from '@stackframe/react';

type Mode = 'signin' | 'signup';

interface StackAuthClientProps {
  mode: Mode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function StackSignIn(props: unknown) {
  return <SignIn {...(props as any)} />; // eslint-disable-line @typescript-eslint/no-explicit-any
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function StackSignUp(props: unknown) {
  return <SignUp {...(props as any)} />; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function StackAuthClient({ mode }: StackAuthClientProps) {
  const Component = mode === 'signin' ? StackSignIn : StackSignUp;

  return (
    <TooltipProvider>
      <Component />
    </TooltipProvider>
  );
}