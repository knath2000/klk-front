import { useEffect, useState, useCallback } from 'react';

/**
 * useLocalStorage - SSR-safe typed localStorage hook
 *
 * Returns a tuple [value, setValue]. When running on the server this hook
 * returns the initialValue and a no-op setter to avoid runtime errors.
 *
 * Usage:
 * const [prefs, setPrefs] = useLocalStorage<MyPrefs>('prefs.key', defaultPrefs);
 */
export function useLocalStorage<T>(key: string, initialValue?: T) {
  const isClient = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

  // Lazy initializer reads from localStorage only on client
  const getInitial = (): T | undefined => {
    if (!isClient) return initialValue;
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return initialValue;
      return JSON.parse(raw) as T;
    } catch (err) {
      // If parsing fails, clear corrupt key and return initialValue
      try {
        localStorage.removeItem(key);
      } catch {}
      // eslint-disable-next-line no-console
      console.warn(`useLocalStorage: failed to parse key ${key}`, err);
      return initialValue;
    }
  };

  const [state, setState] = useState<T | undefined>(getInitial);

  // Keep state in sync if localStorage is changed in another tab/window
  useEffect(() => {
    if (!isClient) return;

    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      try {
        const newVal = e.newValue ? (JSON.parse(e.newValue) as T) : undefined;
        setState(newVal);
      } catch {
        setState(initialValue);
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // initialValue intentionally excluded; key is the driver
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T | undefined) => T)) => {
      if (!isClient) {
        // No-op on server
        return;
      }
      try {
        setState((prev) => {
          const resolved = typeof value === 'function' ? (value as (p: T | undefined) => T)(prev) : value;
          try {
            localStorage.setItem(key, JSON.stringify(resolved));
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn(`useLocalStorage: failed to set key ${key}`, err);
          }
          return resolved;
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('useLocalStorage setter error', err);
      }
    },
    [key, isClient]
  );

  // In case the key or initialValue changes, resync once on client
  useEffect(() => {
    if (!isClient) return;
    setState(getInitial());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [state as T | undefined, setValue] as const;
}