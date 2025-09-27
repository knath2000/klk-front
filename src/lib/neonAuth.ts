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
  // Stack Auth specific cookie patterns
  const stackAuthPatterns = [
    'stack-auth-token',
    'stack_auth_token',
    'stackAuthToken',
    'stack-token',
    'stack_token',
    'stackToken'
  ];

  // Check for exact matches first
  for (const pattern of stackAuthPatterns) {
    if (cookies[pattern]) {
      console.log('🔍 [findStackTokenFromCookies] Found exact match:', pattern);
      return cookies[pattern];
    }
  }

  // Fallback: look for cookie names that contain both "stack" and one of "token" or "session"
  const candidates = Object.keys(cookies).filter((name) => {
    const n = name.toLowerCase();
    return n.includes('stack') && (n.includes('token') || n.includes('session') || n.includes('auth'));
  });

  for (const name of candidates) {
    const val = cookies[name];
    if (val && val.length > 0) {
      console.log('🔍 [findStackTokenFromCookies] Found candidate:', name);
      return val;
    }
  }

  console.log('🔍 [findStackTokenFromCookies] No Stack Auth cookies found');
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

  // Primary: Try cookies first (Stack Auth stores tokens in cookies)
  try {
    const cookieToken = findStackTokenFromCookies();
    if (cookieToken) {
      console.log('🔍 [getNeonAuthToken] Found token in cookies (length:', cookieToken.length, ')');
      return cookieToken;
    }
    console.log('🔍 [getNeonAuthToken] No token found in cookies');
  } catch (error) {
    console.warn('⚠️ [getNeonAuthToken] Cookie check failed:', error);
  }

  // Fallback: Try localStorage
  try {
    const lsToken = findStackTokenFromLocalStorage();
    if (lsToken) {
      console.log('🔍 [getNeonAuthToken] Found token in localStorage (length:', lsToken.length, ')');
      return lsToken;
    }
  } catch (error) {
    console.warn('⚠️ [getNeonAuthToken] localStorage check failed:', error);
  }

  // Fallback: Try sessionStorage
  try {
    const ssToken = findStackTokenFromSessionStorage();
    if (ssToken) {
      console.log('🔍 [getNeonAuthToken] Found token in sessionStorage (length:', ssToken.length, ')');
      return ssToken;
    }
  } catch (error) {
    console.warn('⚠️ [getNeonAuthToken] sessionStorage check failed:', error);
  }

  // Last resort: Try Stack Auth client app (if available)
  try {
    const win = typeof window !== 'undefined' ? (window as WindowWithStack) : undefined;
    if (win?.stackAppInstance?.getToken) {
      console.log('🔍 [getNeonAuthToken] Trying stackAppInstance.getToken...');
      const t = await win.stackAppInstance.getToken();
      if (typeof t === 'string' && t.length > 0) {
        console.log('🔍 [getNeonAuthToken] Got token from stackAppInstance (length:', t.length, ')');
        return t;
      }
      if (t && typeof (t as StackAuthToken)?.token === 'string') {
        const token = (t as StackAuthToken).token;
        if (token) {
          console.log('🔍 [getNeonAuthToken] Got token from stackAppInstance object (length:', token.length, ')');
          return token;
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ [getNeonAuthToken] Stack app check failed:', error);
  }

  // Final fallback: Try global Stack Auth object
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
    // ignore
  }

  console.log('🔍 [getNeonAuthToken] No token found in any location');
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
