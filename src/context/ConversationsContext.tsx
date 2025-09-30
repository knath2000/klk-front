'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { getNeonAuthToken } from '@/lib/neonAuth';

export type ConversationSummary = {
  id: string;
  title?: string | null;
  updated_at: string | Date;
  message_count?: number;
  persona_id?: string | null;
};

type ConversationsContextType = {
  list: ConversationSummary[];
  activeId: string | null;
  setActive: (id: string) => void;
  refresh: () => Promise<void>;
  loading: boolean;
  error: string | null;
  historyLoadingId: string | null; // New: tracks which conversation's history is loading
  notifyHistoryResolved: (conversationId: string) => void; // New: callback to clear loading state
};

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

export function ConversationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { socket, isConnected } = useWebSocket();
  const [list, setList] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoadingId, setHistoryLoadingId] = useState<string | null>(null); // New: shared loading tracker
  const pendingHistoryIdRef = useRef<string | null>(null); // New: guards against duplicate emits
  const lastFetchedUserIdRef = useRef<string | null>(null); // New: prevents redundant fetches on user ref changes

  const backendUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
    []
  );

  const fetchConversations = useCallback(async () => {
    const userId = user?.id;
    if (!userId || userId === lastFetchedUserIdRef.current) {
      return; // Skip if no user or already fetched for this user
    }
    lastFetchedUserIdRef.current = userId;

    setLoading(true);
    setError(null);
    try {
      const token = await getNeonAuthToken();
      if (!token) {
        setError('Missing auth token');
        setLoading(false);
        return;
      }
      const res = await fetch(`${backendUrl}/api/conversations`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        setError(`HTTP ${res.status}: ${res.statusText} ${t.slice(0, 120)}`);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const rows: ConversationSummary[] = Array.isArray(data) ? data : [];
      setList(rows);

      // Validate existing localStorage conversation id
      const stored = typeof window !== 'undefined' ? localStorage.getItem('chatConversationId') : null;
      if (stored && rows.some(r => r.id === stored)) {
        setActiveId(stored);
      } else if (rows.length > 0) {
        setActiveId(rows[0].id);
        if (typeof window !== 'undefined') {
          localStorage.setItem('chatConversationId', rows[0].id);
        }
      } else {
        setActiveId(null);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, [backendUrl, user?.id]); // Depend on user.id, not user object

  // Initial fetch when user becomes available
  useEffect(() => {
    if (user?.id) {
      void fetchConversations();
    } else {
      setList([]);
      setActiveId(null);
      lastFetchedUserIdRef.current = null;
    }
  }, [user?.id, fetchConversations]); // Depend on user.id

  // Guarded emit for load_history: only when activeId changes or reconnects, and no pending for that id
  useEffect(() => {
    if (!activeId || !socket || !isConnected) return;
    if (pendingHistoryIdRef.current === activeId) return; // Already pending

    pendingHistoryIdRef.current = activeId;
    setHistoryLoadingId(activeId);
    try {
      socket.emit('load_history', { conversationId: activeId });
    } catch (e) {
      // swallow; WebSocketContext handles retries
      pendingHistoryIdRef.current = null;
      setHistoryLoadingId(null);
    }
  }, [activeId, socket, isConnected]); // Single effect for both changes and reconnects

  // Clear pending on disconnect
  useEffect(() => {
    if (!isConnected) {
      pendingHistoryIdRef.current = null;
      setHistoryLoadingId(null);
    }
  }, [isConnected]);

  const notifyHistoryResolved = useCallback((conversationId: string) => {
    if (pendingHistoryIdRef.current === conversationId) {
      pendingHistoryIdRef.current = null;
    }
    if (historyLoadingId === conversationId) {
      setHistoryLoadingId(null);
    }
  }, [historyLoadingId]);

  const setActive = useCallback((id: string) => {
    if (!id || id === activeId) return;
    if (!list.some(c => c.id === id)) return;
    setActiveId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatConversationId', id);
    }
  }, [activeId, list]);

  const value: ConversationsContextType = useMemo(() => ({
    list,
    activeId,
    setActive,
    refresh: fetchConversations,
    loading,
    error,
    historyLoadingId, // New
    notifyHistoryResolved, // New
  }), [list, activeId, setActive, fetchConversations, loading, error, historyLoadingId, notifyHistoryResolved]);

  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversations(): ConversationsContextType {
  const ctx = useContext(ConversationsContext);
  if (!ctx) throw new Error('useConversations must be used within ConversationsProvider');
  return ctx;
}

// Optional (non-throwing) accessor for consumers that may render outside provider (e.g., ChatView)
export function useOptionalConversations(): ConversationsContextType | undefined {
  return useContext(ConversationsContext);
}