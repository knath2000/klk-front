'use client';

// Define types for Stack Auth
interface StackAuthToken {
  token?: string;
  [key: string]: unknown;
}

interface StackAuthInstance {
  getToken(): Promise<string | StackAuthToken>;
}

interface WindowWithStack extends Window {
  stack?: StackAuthInstance;
  __getAuthToken?: () => Promise<string>;
}

interface StackModule {
  stack?: StackAuthInstance;
}

export async function getNeonAuthToken(): Promise<string | null> {
  // Attempt 1: global Stack Auth object on window
  try {
    const win = typeof window !== 'undefined' ? (window as WindowWithStack) : undefined;
    if (win?.stack?.getToken) {
      const t = await win.stack.getToken();
      if (typeof t === 'string') return t;
      if (t && typeof (t as StackAuthToken)?.token === 'string') {
        const token = (t as StackAuthToken).token;
        return token || null;
      }
    }
  } catch {
    // ignore and try next strategy
  }

  // Attempt 2 removed: avoid importing @stackframe/react to prevent "useStackApp must be used within a StackProvider" during prerender
  // If needed in the future, re-enable with a safe runtime-only import guard.

  // Fallback: allow apps to set a global provider (useful during initial wiring)
  try {
    const win = typeof window !== 'undefined' ? (window as WindowWithStack) : undefined;
    if (typeof win?.__getAuthToken === 'function') {
      const t = await win.__getAuthToken();
      if (typeof t === 'string') return t;
    }
  } catch {
    // ignore
  }

  return null;
}