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
  console.log('🔍 [findStackTokenFromCookies] All cookies:', Object.keys(cookies));

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
      console.log('🔍 [findStackTokenFromCookies] Found exact match:', pattern, 'value length:', cookies[pattern].length);
      return cookies[pattern];
    }
  }

  // Special handling for Stack Auth's stack-access cookie (URL-encoded JSON array)
  if (cookies['stack-access']) {
    try {
      const encodedValue = cookies['stack-access'];
      console.log('🔍 [findStackTokenFromCookies] Found stack-access cookie, attempting to decode...');

      // URL decode the value
      const decodedValue = decodeURIComponent(encodedValue);
      console.log('🔍 [findStackTokenFromCookies] Decoded value:', decodedValue.substring(0, 50) + '...');

      // Parse as JSON array
      const tokenArray = JSON.parse(decodedValue);
      if (Array.isArray(tokenArray) && tokenArray.length >= 2) {
        // Stack Auth format: [refresh_token, access_token]
        const accessToken = tokenArray[1];
        if (typeof accessToken === 'string' && accessToken.startsWith('eyJ')) {
          console.log('🔍 [findStackTokenFromCookies] SUCCESS: Extracted JWT from stack-access array, length:', accessToken.length);
          console.log('🔍 [findStackTokenFromCookies] JWT preview:', accessToken.substring(0, 20) + '...');
          return accessToken;
        }
      }
    } catch (error) {
      console.warn('⚠️ [findStackTokenFromCookies] Failed to parse stack-access cookie:', error);
    }
  }

  // Fallback: look for cookie names that contain both "stack" and one of "token" or "session"
  const candidates = Object.keys(cookies).filter((name) => {
    const n = name.toLowerCase();
    return n.includes('stack') && (n.includes('token') || n.includes('session') || n.includes('auth'));
  });

  console.log('🔍 [findStackTokenFromCookies] Candidate cookies:', candidates);

  for (const name of candidates) {
    const val = cookies[name];
    if (val && val.length > 0) {
      console.log('🔍 [findStackTokenFromCookies] Found candidate:', name, 'value length:', val.length);
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

  // Add comprehensive cookie debugging
  if (typeof document !== 'undefined') {
    console.log('🔍 [getNeonAuthToken] ALL document cookies:', document.cookie);
    const allCookies = readCookieMap();
    console.log('🔍 [getNeonAuthToken] Parsed cookies:', Object.keys(allCookies));
    Object.entries(allCookies).forEach(([key, value]) => {
      console.log(`🔍 [getNeonAuthToken] Cookie "${key}": length=${value.length}, preview="${value.substring(0, 20)}..."`);
    });
  }

  // Try to get token directly from Stack Auth app instance FIRST
  try {
    const win = typeof window !== 'undefined' ? (window as WindowWithStack) : undefined;
    if (win?.stackAppInstance) {
      console.log('🔍 [getNeonAuthToken] Found stackAppInstance, trying to get token directly...');

      // Try the most direct method first - getAccessToken or similar
      const app = win.stackAppInstance;
      console.log('🔍 [getNeonAuthToken] Stack app instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(app)));
      console.log('🔍 [getNeonAuthToken] Stack app instance properties:', Object.keys(app));

      // Check if user is signed in
      let isSignedIn = false;
      try {
        if (typeof (app as any).getUser === 'function') {
          const user = await (app as any).getUser();
          isSignedIn = !!user;
          console.log('🔍 [getNeonAuthToken] User authentication status:', isSignedIn, 'User:', user);
        } else if (typeof (app as any).isAuthenticated === 'function') {
          isSignedIn = await (app as any).isAuthenticated();
          console.log('🔍 [getNeonAuthToken] isAuthenticated result:', isSignedIn);
        } else if (typeof (app as any).signedIn === 'function') {
          isSignedIn = await (app as any).signedIn();
          console.log('🔍 [getNeonAuthToken] signedIn result:', isSignedIn);
        } else if ((app as any).user) {
          isSignedIn = true;
          console.log('🔍 [getNeonAuthToken] User found in app.user property');
        }
      } catch (authCheckError) {
        console.warn('⚠️ [getNeonAuthToken] Authentication check failed:', authCheckError);
      }

      if (!isSignedIn) {
        console.log('🔍 [getNeonAuthToken] User is not authenticated, skipping token retrieval');
        return null;
      }

      console.log('🔍 [getNeonAuthToken] User is authenticated, trying to get token...');

      // Try getAccessToken method (common in auth libraries)
      if (typeof (app as any).getAccessToken === 'function') {
        console.log('🔍 [getNeonAuthToken] Trying getAccessToken method...');
        try {
          const token = await (app as any).getAccessToken();
          if (token && typeof token === 'string' && token.length > 50) {
            console.log('🔍 [getNeonAuthToken] SUCCESS: Got token from getAccessToken (length:', token.length, ')');
            console.log('🔍 [getNeonAuthToken] Token preview (first 20):', token.substring(0, 20) + '...');
            console.log('🔍 [getNeonAuthToken] Token format analysis:', {
              startsWithEyJ: token.startsWith('eyJ'),
              containsDots: token.includes('.'),
              dotCount: token.split('.').length,
              totalLength: token.length,
              firstChars: token.substring(0, 10),
              lastChars: token.substring(token.length - 10)
            });
            return token;
          }
        } catch (error) {
          console.warn('⚠️ [getNeonAuthToken] getAccessToken failed:', error);
        }
      }

      // Try getToken method
      if (typeof (app as any).getToken === 'function') {
        console.log('🔍 [getNeonAuthToken] Trying getToken method...');
        try {
          const token = await (app as any).getToken();
          if (token && typeof token === 'string' && token.length > 50) {
            console.log('🔍 [getNeonAuthToken] SUCCESS: Got token from getToken (length:', token.length, ')');
            console.log('🔍 [getNeonAuthToken] Token preview (first 20):', token.substring(0, 20) + '...');
            console.log('🔍 [getNeonAuthToken] Token format analysis:', {
              startsWithEyJ: token.startsWith('eyJ'),
              containsDots: token.includes('.'),
              dotCount: token.split('.').length,
              totalLength: token.length,
              firstChars: token.substring(0, 10),
              lastChars: token.substring(token.length - 10)
            });
            return token;
          }
        } catch (error) {
          console.warn('⚠️ [getNeonAuthToken] getToken failed:', error);
        }
      }

      // Check for token property directly
      if ((app as any).token && typeof (app as any).token === 'string') {
        const token = (app as any).token;
        if (token.length > 50) {
          console.log('🔍 [getNeonAuthToken] SUCCESS: Got token from .token property (length:', token.length, ')');
          return token;
        }
      }

      // Check for accessToken property
      if ((app as any).accessToken && typeof (app as any).accessToken === 'string') {
        const token = (app as any).accessToken;
        if (token.length > 50) {
          console.log('🔍 [getNeonAuthToken] SUCCESS: Got token from .accessToken property (length:', token.length, ')');
          return token;
        }
      }

      console.log('🔍 [getNeonAuthToken] No token found in Stack Auth app instance');
    } else {
      console.log('🔍 [getNeonAuthToken] No stackAppInstance found on window');
    }
  } catch (error) {
    console.warn('⚠️ [getNeonAuthToken] Stack Auth app instance check failed:', error);
  }

  // Primary: Try cookies first (Stack Auth stores tokens in cookies)
  try {
    const cookieToken = findStackTokenFromCookies();
    if (cookieToken) {
      console.log('🔍 [getNeonAuthToken] Found token in cookies (length:', cookieToken.length, ')');
      console.log('🔍 [getNeonAuthToken] Cookie token preview (first 20):', cookieToken.substring(0, 20) + '...');
      console.log('🔍 [getNeonAuthToken] Cookie token format analysis:', {
        startsWithEyJ: cookieToken.startsWith('eyJ'),
        containsDots: cookieToken.includes('.'),
        dotCount: cookieToken.split('.').length,
        totalLength: cookieToken.length,
        firstChars: cookieToken.substring(0, 10),
        lastChars: cookieToken.substring(cookieToken.length - 10)
      });
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
      console.log('🔍 [getNeonAuthToken] localStorage token preview (first 20):', lsToken.substring(0, 20) + '...');
      console.log('🔍 [getNeonAuthToken] localStorage token format analysis:', {
        startsWithEyJ: lsToken.startsWith('eyJ'),
        containsDots: lsToken.includes('.'),
        dotCount: lsToken.split('.').length,
        totalLength: lsToken.length,
        firstChars: lsToken.substring(0, 10),
        lastChars: lsToken.substring(lsToken.length - 10)
      });
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
      console.log('🔍 [getNeonAuthToken] sessionStorage token preview (first 20):', ssToken.substring(0, 20) + '...');
      console.log('🔍 [getNeonAuthToken] sessionStorage token format analysis:', {
        startsWithEyJ: ssToken.startsWith('eyJ'),
        containsDots: ssToken.includes('.'),
        dotCount: ssToken.split('.').length,
        totalLength: ssToken.length,
        firstChars: ssToken.substring(0, 10),
        lastChars: ssToken.substring(ssToken.length - 10)
      });
      return ssToken;
    }
  } catch (error) {
    console.warn('⚠️ [getNeonAuthToken] sessionStorage check failed:', error);
  }

  // Last resort: Try Stack Auth client app (if available)
  try {
    const win = typeof window !== 'undefined' ? (window as WindowWithStack) : undefined;
    if (win?.stackAppInstance) {
      console.log('🔍 [getNeonAuthToken] Found stackAppInstance, inspecting it...');
      console.log('🔍 [getNeonAuthToken] stackAppInstance type:', typeof win.stackAppInstance);
      console.log('🔍 [getNeonAuthToken] stackAppInstance keys:', Object.keys(win.stackAppInstance));
      console.log('🔍 [getNeonAuthToken] stackAppInstance prototype:', Object.getPrototypeOf(win.stackAppInstance));
      console.log('🔍 [getNeonAuthToken] stackAppInstance constructor:', win.stackAppInstance.constructor?.name);

      // Try different possible methods to get the token
      const possibleMethods = ['getToken', 'getAccessToken', 'getIdToken', 'token', 'accessToken', 'getUser', 'user'];
      for (const method of possibleMethods) {
        if (typeof (win.stackAppInstance as any)[method] === 'function') {
          console.log('🔍 [getNeonAuthToken] Trying method:', method);
          try {
            const t = await (win.stackAppInstance as any)[method]();
            console.log('🔍 [getNeonAuthToken] Method', method, 'returned:', typeof t, 'length:', typeof t === 'string' ? t.length : 'N/A');
            if (typeof t === 'string' && t.length > 50) { // JWTs are typically much longer than 50 chars
              console.log('🔍 [getNeonAuthToken] Got potential JWT from method:', method, 'length:', t.length);
              console.log('🔍 [getNeonAuthToken] JWT preview (first 20):', t.substring(0, 20) + '...');
              console.log('🔍 [getNeonAuthToken] JWT format analysis:', {
                startsWithEyJ: t.startsWith('eyJ'),
                containsDots: t.includes('.'),
                dotCount: t.split('.').length,
                totalLength: t.length,
                firstChars: t.substring(0, 10),
                lastChars: t.substring(t.length - 10)
              });
              return t;
            }
            if (t && typeof (t as StackAuthToken)?.token === 'string') {
              const token = (t as StackAuthToken).token;
              if (token && token.length > 50) {
                console.log('🔍 [getNeonAuthToken] Got token from method object:', method, 'length:', token.length);
                console.log('🔍 [getNeonAuthToken] Token preview (first 20):', token.substring(0, 20) + '...');
                console.log('🔍 [getNeonAuthToken] Token format analysis:', {
                  startsWithEyJ: token.startsWith('eyJ'),
                  containsDots: token.includes('.'),
                  dotCount: token.split('.').length,
                  totalLength: token.length,
                  firstChars: token.substring(0, 10),
                  lastChars: token.substring(token.length - 10)
                });
                return token;
              }
            }
            if (t && typeof t === 'object' && (t as any).accessToken) {
              console.log('🔍 [getNeonAuthToken] Found accessToken in object from method:', method, 'length:', (t as any).accessToken.length);
              console.log('🔍 [getNeonAuthToken] accessToken preview (first 20):', (t as any).accessToken.substring(0, 20) + '...');
              console.log('🔍 [getNeonAuthToken] accessToken format analysis:', {
                startsWithEyJ: (t as any).accessToken.startsWith('eyJ'),
                containsDots: (t as any).accessToken.includes('.'),
                dotCount: (t as any).accessToken.split('.').length,
                totalLength: (t as any).accessToken.length,
                firstChars: (t as any).accessToken.substring(0, 10),
                lastChars: (t as any).accessToken.substring((t as any).accessToken.length - 10)
              });
              return (t as any).accessToken;
            }
          } catch (methodError) {
            console.warn('⚠️ [getNeonAuthToken] Method', method, 'failed:', methodError);
          }
        }
      }

      // Try accessing token as a property
      const possibleProps = ['token', 'accessToken', 'idToken', 'user', 'currentUser'];
      for (const prop of possibleProps) {
        if ((win.stackAppInstance as any)[prop]) {
          const val = (win.stackAppInstance as any)[prop];
          console.log('🔍 [getNeonAuthToken] Found property:', prop, 'type:', typeof val, 'length:', typeof val === 'string' ? val.length : 'N/A');
          if (typeof val === 'string' && val.length > 50) {
            console.log('🔍 [getNeonAuthToken] Got potential JWT from property:', prop, 'length:', val.length);
            console.log('🔍 [getNeonAuthToken] Property token preview (first 20):', val.substring(0, 20) + '...');
            console.log('🔍 [getNeonAuthToken] Property token format analysis:', {
              startsWithEyJ: val.startsWith('eyJ'),
              containsDots: val.includes('.'),
              dotCount: val.split('.').length,
              totalLength: val.length,
              firstChars: val.substring(0, 10),
              lastChars: val.substring(val.length - 10)
            });
            return val;
          }
          if (val && typeof val === 'object' && (val as any).accessToken) {
            console.log('🔍 [getNeonAuthToken] Found accessToken in property object:', prop, 'length:', (val as any).accessToken.length);
            console.log('🔍 [getNeonAuthToken] Property accessToken preview (first 20):', (val as any).accessToken.substring(0, 20) + '...');
            console.log('🔍 [getNeonAuthToken] Property accessToken format analysis:', {
              startsWithEyJ: (val as any).accessToken.startsWith('eyJ'),
              containsDots: (val as any).accessToken.includes('.'),
              dotCount: (val as any).accessToken.split('.').length,
              totalLength: (val as any).accessToken.length,
              firstChars: (val as any).accessToken.substring(0, 10),
              lastChars: (val as any).accessToken.substring((val as any).accessToken.length - 10)
            });
            return (val as any).accessToken;
          }
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
      if (typeof t === 'string') {
        console.log('🔍 [getNeonAuthToken] Got token from global stack.getToken() (length:', t.length, ')');
        console.log('🔍 [getNeonAuthToken] Global token preview (first 20):', t.substring(0, 20) + '...');
        console.log('🔍 [getNeonAuthToken] Global token format analysis:', {
          startsWithEyJ: t.startsWith('eyJ'),
          containsDots: t.includes('.'),
          dotCount: t.split('.').length,
          totalLength: t.length,
          firstChars: t.substring(0, 10),
          lastChars: t.substring(t.length - 10)
        });
        return t;
      }
      if (t && typeof (t as StackAuthToken)?.token === 'string') {
        const token = (t as StackAuthToken).token;
        if (token) {
          console.log('🔍 [getNeonAuthToken] Got token from global stack.getToken() object (length:', token.length, ')');
          console.log('🔍 [getNeonAuthToken] Global object token preview (first 20):', token.substring(0, 20) + '...');
          console.log('🔍 [getNeonAuthToken] Global object token format analysis:', {
            startsWithEyJ: token.startsWith('eyJ'),
            containsDots: token.includes('.'),
            dotCount: token.split('.').length,
            totalLength: token.length,
            firstChars: token.substring(0, 10),
            lastChars: token.substring(token.length - 10)
          });
          return token;
        }
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

export async function debugStackAuth() {
  console.log('🔍 [debugStackAuth] Starting Stack Auth inspection...');

  const win = typeof window !== 'undefined' ? (window as WindowWithStack) : undefined;
  if (!win) {
    console.log('🔍 [debugStackAuth] No window object');
    return;
  }

  console.log('🔍 [debugStackAuth] Window properties:', Object.keys(win));
  console.log('🔍 [debugStackAuth] stackAppInstance exists:', !!win.stackAppInstance);

  if (win.stackAppInstance) {
    const app = win.stackAppInstance;
    console.log('🔍 [debugStackAuth] Stack app instance type:', typeof app);
    console.log('🔍 [debugStackAuth] Stack app instance constructor:', app.constructor?.name);
    console.log('🔍 [debugStackAuth] Stack app instance properties:', Object.keys(app));
    console.log('🔍 [debugStackAuth] Stack app instance prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(app)));

    // Try to get user
    try {
      if (typeof (app as any).getUser === 'function') {
        const user = await (app as any).getUser();
        console.log('🔍 [debugStackAuth] getUser() result:', user);
      }
    } catch (error) {
      console.warn('🔍 [debugStackAuth] getUser() failed:', error);
    }

    // Try to get token
    try {
      if (typeof (app as any).getToken === 'function') {
        const token = await (app as any).getToken();
        console.log('🔍 [debugStackAuth] getToken() result:', typeof token, 'length:', typeof token === 'string' ? token.length : 'N/A');
        if (typeof token === 'string' && token.length > 10) {
          console.log('🔍 [debugStackAuth] Token preview:', token.substring(0, 20) + '...');
        }
      }
    } catch (error) {
      console.warn('🔍 [debugStackAuth] getToken() failed:', error);
    }

    // Check for direct properties
    const propsToCheck = ['token', 'accessToken', 'user', 'currentUser'];
    for (const prop of propsToCheck) {
      if ((app as any)[prop]) {
        console.log(`🔍 [debugStackAuth] Property ${prop}:`, (app as any)[prop]);
      }
    }
  }

  // Check cookies
  if (typeof document !== 'undefined') {
    console.log('🔍 [debugStackAuth] All cookies:', document.cookie);
    const allCookies = readCookieMap();
    console.log('🔍 [debugStackAuth] Parsed cookies:', Object.keys(allCookies));
    Object.entries(allCookies).forEach(([key, value]) => {
      if (key.toLowerCase().includes('stack') || key.toLowerCase().includes('auth') || key.toLowerCase().includes('token')) {
        console.log(`🔍 [debugStackAuth] Relevant cookie "${key}": length=${value.length}, preview="${value.substring(0, 20)}..."`);
      }
    });
  }

  console.log('🔍 [debugStackAuth] Inspection complete');
}

// Make it available globally for console debugging
if (typeof window !== 'undefined') {
  (window as any).debugStackAuth = debugStackAuth;
}
