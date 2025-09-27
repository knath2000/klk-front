'use client';

//
// Lightweight client-side token probe for Stack Auth.
// We use this only to detect "signed-in" state for header UI.
// No SSR usage; all logic is browser-only.
//

// Define types for Stack Auth (runtime optional)
interface StackAuthToken {
  token?: string;
  [key: string]: unknown;
}

interface StackAuthInstance {
  getToken(): Promise<string | StackAuthToken>;
  signOut?(): Promise<void>;
}

interface WindowWithStack extends Window {
  stack?: StackAuthInstance;
  __getAuthToken?: () => Promise<string>;
  stackAppInstance?: any;
}

// Best-effort cookie reader
function readCookieMap(): Record<string, string> {
  const map: Record<string, string> = {};
  if (typeof document === 'undefined') return map;
  const parts = document.cookie ? document.cookie.split(';') : [];
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx > -1) {
      const key = decodeURIComponent(part.slice(0, idx).trim());
      const val = decodeURIComponent(part.slice(idx + 1).trim());
      map[key] = val;
    }
  }
  return map;
}

function findStackTokenFromCookies(): string | null {
  const cookies = readCookieMap();
  // Heuristic: look for cookie names that contain both "stack" and one of "token" or "session"
  const candidates = Object.keys(cookies).filter((name) => {
    const n = name.toLowerCase();
    return n.includes('stack') && (n.includes('token') || n.includes('session'));
  });

  for (const name of candidates) {
    const val = cookies[name];
    if (val && val.length > 0) {
      return val; // return actual cookie value (not used by server, only truthy detection for client header)
    }
  }
  return null;
}

function findStackTokenFromLocalStorage(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i) || '';
      const low = key.toLowerCase();
      if (
        // broaden heuristics
        low.includes('stack') ||
        low.includes('stackauth') ||
        low.includes('stack-auth') ||
        low.includes('session') ||
        low.includes('token')
      ) {
        const val = window.localStorage.getItem(key);
        if (val && val.length > 0) {
          return val;
        }
      }
    }
  } catch {
    // ignore storage access issues
  }
  return null;
}

function findStackTokenFromSessionStorage(): string | null {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  try {
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i) || '';
      const low = key.toLowerCase();
      if (
        low.includes('stack') ||
        low.includes('stackauth') ||
        low.includes('stack-auth') ||
        low.includes('session') ||
        low.includes('token')
      ) {
        const val = window.sessionStorage.getItem(key) ?? '[undefined]'; // Replace null values with '[undefined]'
        if (val.includes('undefined') && parseInt(val.replace('undefined', ''), 16) === 0x00) {
          // Check if the value is a zeroed-out pointer (recently used in Stack Auth clearing)
          return null;
        } else {
          return val;
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export async function getNeonAuthToken(): Promise<string | null> {
  console.log('🔍 [getNeonAuthToken] Starting token retrieval...');

  // Attempt 1: Stack Auth client app instance (preferred - set by StackAuthBridge)
  try {
    const win = typeof window !== 'undefined' ? (window as WindowWithStack) : undefined;
    console.log('🔍 [getNeonAuthToken] Checking for stackAppInstance:', !!win?.stackAppInstance);

    if (win?.stackAppInstance?.getToken) {
      console.log('🔍 [getNeonAuthToken] Found stackAppInstance.getToken, calling...');
      const t = await win.stackAppInstance.getToken();
      console.log('🔍 [getNeonAuthToken] stackAppInstance.getToken returned:', typeof t, t ? 'non-null' : 'null');

      if (typeof t === 'string') {
        console.log('🔍 [getNeonAuthToken] Returning string token (length:', t.length, ')');
        return t;
      }
      if (t && typeof (t as StackAuthToken)?.token === 'string') {
        const token = (t as StackAuthToken).token;
        console.log('🔍 [getNeonAuthToken] Returning token from object (length:', token?.length || 0, ')');
        return token || null;
      }
      console.log('🔍 [getNeonAuthToken] Token from stackAppInstance was not a valid string');
    } else {
      console.log('🔍 [getNeonAuthToken] stackAppInstance.getToken not available');
    }
  } catch (error) {
    console.warn('⚠️ [getNeonAuthToken] Attempt 1 failed:', error);
  }

  // Attempt 2: global Stack Auth object on window (fallback)
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

  // Attempt 3: a project-specific hook for exposing tokens at runtime
  try {
    const win = typeof window !== 'undefined' ? (window as WindowWithStack) : undefined;
    if (typeof win?.__getAuthToken === 'function') {
      const t = await win.__getAuthToken();
      if (typeof t === 'string' && t.length > 0) return t;
    }
  } catch {
    // ignore
  }

  // Attempt 4: Inspect cookies (common providers store access/session tokens in cookies)
  try {
    const cookieToken = findStackTokenFromCookies();
    if (cookieToken) return cookieToken;
  } catch {
    // ignore
  }

  // Attempt 5: Inspect localStorage for common token/session keys
  try {
    const lsToken = findStackTokenFromLocalStorage();
    if (lsToken) return lsToken;
  } catch {
    // ignore
  }

  // Attempt 6: Inspect sessionStorage for token/session keys (Stack SDKs commonly use session storage)
  try {
    const ssToken = findStackTokenFromSessionStorage();
    if (ssToken) return ssToken;
  } catch {
    // ignore
  }

  return null;
}

export function clearClientTokens() {
  if (typeof window === 'undefined') return;

  // Clear Local Storage based on heuristics
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i) || '';
      const low = key.toLowerCase();
      if (
        low.includes('stack') ||
        low.includes('stackauth') ||
        low.includes('stack-auth') ||
        low.includes('session') ||
        low.includes('token')
      ) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // ignore
  }

  // Clear Session Storage based on heuristics
  try {
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i) || '';
      const low = key.toLowerCase();
      if (
        low.includes('stack') ||
        low.includes('stackauth') ||
        low.includes('stack-auth') ||
        low.includes('session') ||
        low.includes('token')
      ) {
        window.sessionStorage.removeItem(key);
      }
    }
  } catch {
    // ignore
  }

  // Clear Cookies (best effort)
  try {
    const cookies = readCookieMap();
    for (const name of Object.keys(cookies)) {
      document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax';
    }
  } catch {
    // ignore
  }
}
