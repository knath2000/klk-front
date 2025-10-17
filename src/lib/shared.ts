export type ToastType = 'success' | 'error' | 'info';

/**
 * Resolve backend URL consistently across the app.
 * Falls back to localhost for development.
 */
export const getBackendUrl = (): string => {
  if (typeof window === 'undefined') {
    // Server-side: use NEXT_PUBLIC_BACKEND_URL if provided, else localhost
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  }
  const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (envUrl && envUrl.length > 0) return envUrl;
  // Default development backend
  return location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://klk-back.onrender.com';
};

/**
 * Lightweight notification helper.
 * Default implementation dispatches a CustomEvent so the app can render toasts consistently.
 * If no listener exists, falls back to console.
 */
export const showNotification = (message: string, type: ToastType = 'info', opts?: { ttlMs?: number }) => {
  try {
    const event = new CustomEvent('klk:toast', { detail: { message, type, ttlMs: opts?.ttlMs || 4000 } });
    // Dispatch to window for any global toast component to consume
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
      // If no toast system listens, also output to console for visibility
      // (listeners can preventDefault on this event to suppress console logs if desired)
      // A quick heuristic: wait a tick and log if no listeners responded (best-effort)
      setTimeout(() => {
        // best-effort: console.info as fallback
        console[type === 'error' ? 'error' : 'info'](`[toast:${type}] ${message}`);
      }, 10);
    } else {
      // server-side fallback
      // eslint-disable-next-line no-console
      console.info(`[toast:${type}] ${message}`);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('showNotification failed', err);
  }
};

/**
 * Minimal, typed localStorage wrapper with SSR safety and JSON safety.
 */
export const Storage = {
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
      const s = JSON.stringify(value);
      localStorage.setItem(key, s);
    } catch (err) {
      console.warn('Storage.set failed', key, err);
    }
  },

  get: <T>(key: string, fallback?: T | null): T | null => {
    if (typeof window === 'undefined') return fallback ?? null;
    try {
      const item = localStorage.getItem(key);
      if (!item) return fallback ?? null;
      return JSON.parse(item) as T;
    } catch (err) {
      console.warn('Storage.get failed, clearing corrupt key', key, err);
      try {
        localStorage.removeItem(key);
      } catch {}
      return fallback ?? null;
    }
  },

  clear: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn('Storage.clear failed', key, err);
    }
  }
};

/**
 * apiFetch: Lightweight fetch wrapper with retries and exponential backoff.
 * - Accepts generic return type T
 * - Retries on network failures and 5xx responses
 * - Throws when response is not ok after retries
 */
export async function apiFetch<T = unknown>(
  input: RequestInfo,
  init: RequestInit = {},
  options: { retries?: number; retryDelayMs?: number } = {}
): Promise<T> {
  const retries = options.retries ?? 2;
  const baseDelay = options.retryDelayMs ?? 250;

  let attempt = 0;
  let lastError: unknown = null;

  // Normalize URL: if input is relative path, resolve against backend when starting with /api/ or when requested
  const resolvedInput = (typeof input === 'string' && input.startsWith('/')) ? (getBackendUrl().replace(/\/$/, '') + input) : input;

  while (attempt <= retries) {
    try {
      const resp = await fetch(resolvedInput, init);

      if (resp.ok) {
        // Try to parse JSON, but return raw text if not JSON
        const ct = resp.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          return (await resp.json()) as T;
        }
        // If expecting JSON but got other, still attempt text
        const text = await resp.text();
        // @ts-ignore - cast to T as best-effort
        return text as unknown as T;
      }

      // Retry on 5xx
      if (resp.status >= 500 && resp.status < 600) {
        lastError = new Error(`Server error ${resp.status}`);
        throw lastError;
      }

      // For 401/403/4xx non-retryable, surface the error with parsed body when possible
      let bodyText = '';
      try {
        bodyText = await resp.text();
      } catch {}
      throw new Error(`Request failed ${resp.status} ${resp.statusText}: ${bodyText}`);
    } catch (err) {
      lastError = err;
      attempt += 1;
      if (attempt > retries) break;
      // Exponential backoff with jitter
      const jitter = Math.round(Math.random() * 100);
      const delay = Math.round(baseDelay * Math.pow(2, attempt - 1)) + jitter;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  // All retries exhausted
  throw lastError ?? new Error('apiFetch: unknown error');
}