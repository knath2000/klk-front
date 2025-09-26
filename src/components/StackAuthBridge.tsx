'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { StackProvider, StackClientApp, StackTheme, useUser } from '@stackframe/react';
import type { StackClientApp as StackClientAppTyped } from '@stackframe/react';
import { useAuth } from '@/context/AuthContext';

// Keys are injected in layout.tsx into window.* and also available via NEXT_PUBLIC_* at build time
declare global {
  interface Window {
    NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY?: string;
    NEXT_PUBLIC_STACK_PROJECT_ID?: string;
  }
}

interface WindowWithStackApp extends Window {
  stackAppInstance?: StackClientApp<true, 'cookie'>;
}

function UserSync() {
  // useUser() can be different shapes across SDK versions; normalize defensively
  const raw = useUser() as unknown;
  const { updateUser } = useAuth();

  useEffect(() => {
    const anyUser = (raw || null) as
      | null
      | {
          id?: string;
          primaryEmail?: string;
          displayName?: string;
          profileImageUrl?: string;
          user?: {
            id?: string;
            primaryEmail?: string;
            displayName?: string;
            profileImageUrl?: string;
          };
        };

    if (anyUser && typeof anyUser === 'object') {
      const id = anyUser.id ?? anyUser.user?.id;
      const primaryEmail = anyUser.primaryEmail ?? anyUser.user?.primaryEmail;
      const displayName = anyUser.displayName ?? anyUser.user?.displayName;
      const profileImageUrl = anyUser.profileImageUrl ?? anyUser.user?.profileImageUrl;

      if (id || primaryEmail || displayName || profileImageUrl) {
        updateUser({
          id: id || 'stack-auth-user',
          email: primaryEmail || '',
          name: displayName || 'Account',
          image: profileImageUrl || undefined,
        });
        return;
      }
    }
    // No user available → reflect signed-out state
    updateUser(null);
  }, [raw, updateUser]);

  return null;
}

export default function StackAuthBridge({ children }: { children: React.ReactNode }) {
  // Prevent SSR by only rendering on client
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Resolve keys from process.env or runtime window (covers Vercel and client-side hydration)
  const publishableKey =
    process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY ||
    (typeof window !== 'undefined' ? window.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY : '');

  const projectId =
    process.env.NEXT_PUBLIC_STACK_PROJECT_ID ||
    (typeof window !== 'undefined' ? window.NEXT_PUBLIC_STACK_PROJECT_ID : '');

  // Avoid calling hooks conditionally; compute app via useMemo and render conditionally below
  const hasKeys = Boolean(publishableKey && projectId);

  const app = useMemo(() => {
    if (!hasKeys) return null;
    return new StackClientApp({
      tokenStore: 'cookie',
      publishableClientKey: publishableKey as string,
      projectId: projectId as string,
    }) as StackClientApp<true, 'cookie'>;
  }, [hasKeys, publishableKey, projectId]);

  useEffect(() => {
    if (app) {
      (window as WindowWithStackApp).stackAppInstance = app;
    }
  }, [app]);

  // Don't render anything during SSR or if keys are missing
  if (!isClient || !hasKeys || !app) {
    return <>{children}</>;
  }

  // @ts-ignore Stack Auth app prop typing mismatch
  const typedApp = app as any;

  return (
    // @ts-ignore
    <StackProvider app={app}>
      <StackTheme>
        <UserSync />
        {children}
      </StackTheme>
    </StackProvider>
  );
}