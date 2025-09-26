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

function UserSync() {
  // useUser() can be different shapes across SDK versions; normalize defensively
  const raw = useUser() as unknown;
  const { setUser } = useAuth();

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
        setUser({
          id: id || 'stack-auth-user',
          email: primaryEmail || '',
          name: displayName || 'Account',
          image: profileImageUrl || undefined,
        });
        return;
      }
    }
    // No user available → reflect signed-out state
    setUser(null);
  }, [raw, setUser]);

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

  const app = useMemo<StackClientAppTyped | null>(() => {
    if (!hasKeys) return null;
    return new StackClientApp({
      tokenStore: 'memory',
      publishableClientKey: publishableKey as string,
      projectId: projectId as string,
    }) as unknown as StackClientAppTyped<true, string>;
  }, [hasKeys, publishableKey, projectId]);

  // Don't render anything during SSR or if keys are missing
  if (!isClient || !hasKeys || !app) {
    return <>{children}</>;
  }

  return (
    <StackProvider app={app as any}> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
      <StackTheme>
        <UserSync />
        {children}
      </StackTheme>
    </StackProvider>
  );
}