'use client'
import { useEffect, useState } from 'react';

export default function useAnimationsReady(): boolean {
  const [ready, setReady] = useState(false);

  if (typeof window === 'undefined') {
    // Server: always false
    return false;
  }

  useEffect(() => {
    const onIdle = () => setReady(true);

    if ('requestIdleCallback' in window) {
      // @ts-ignore
      const id = (window as any).requestIdleCallback(onIdle, { timeout: 200 });
      return () => (window as any).cancelIdleCallback?.(id);
    }

    const t = setTimeout(onIdle, 250);
    return () => clearTimeout(t);
  }, []);

  return ready;
}