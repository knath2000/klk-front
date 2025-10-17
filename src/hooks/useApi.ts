import { useEffect, useRef, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/shared';

export type UseApiOptions = {
  retries?: number;
  cacheKey?: string;
  cacheTTL?: number; // ms
  skip?: boolean;
  init?: RequestInit;
};

/**
 * Simple in-memory cache used for the hook's cacheKey option.
 * This is intentionally lightweight and not persisted across reloads.
 */
const memoryCache = new Map<string, { ts: number; data: unknown }>();

export function useApi<T = unknown>(url: string | null, options: UseApiOptions = {}) {
  const { retries = 2, cacheKey, cacheTTL = 60_000, skip = false, init } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!skip && Boolean(url));
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const fetchIndexRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const doFetch = useCallback(async (force = false) => {
    if (!url || skip) return;
    // cache
    if (!force && cacheKey) {
      const entry = memoryCache.get(cacheKey);
      if (entry && Date.now() - entry.ts < cacheTTL) {
        setData(entry.data as T);
        setLoading(false);
        setError(null);
        return;
      }
    }

    setLoading(true);
    setError(null);
    const currentFetch = ++fetchIndexRef.current;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    try {
      const resp = await apiFetch<T>(url, { ...init, signal }, { retries });
      if (!mountedRef.current) return;
      // ensure no out-of-order resolution
      if (currentFetch !== fetchIndexRef.current) return;
      setData(resp);
      setLoading(false);
      setError(null);
      if (cacheKey) {
        memoryCache.set(cacheKey, { ts: Date.now(), data: resp as unknown });
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      if (err.name === 'AbortError') {
        // aborted - keep previous state
        setLoading(false);
        return;
      }
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
  }, [url, skip, cacheKey, cacheTTL, init, retries]);

  // initial fetch
  useEffect(() => {
    if (skip || !url) return;
    void doFetch(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, skip, cacheKey]);

  const refetch = useCallback((force = false) => {
    return doFetch(force);
  }, [doFetch]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}