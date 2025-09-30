'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
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
};

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

export function ConversationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { socket, isConnected } = useWebSocket();
  const [list, setList] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
    []
  );

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setList([]);
      setActiveId(null);
      return;
    }
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
  }, [backendUrl, user]);

  // Initial fetch when user becomes available
  useEffect(() => {
    if (user) {
      void fetchConversations();
    } else {
      setList([]);
      setActiveId(null);
    }
  }, [user, fetchConversations]);

  // Emit load_history when activeId changes and socket is connected
  useEffect(() => {
    if (!activeId || !socket) return;
    if (!isConnected) return;
    try {
      socket.emit('load_history', { conversationId: activeId });
    } catch (e) {
      // swallow; WebSocketContext handles retries
    }
  }, [activeId, socket, isConnected]);

  // On socket reconnect, re-emit for current activeId
  useEffect(() => {
    if (isConnected && socket && activeId) {
      try { socket.emit('load_history', { conversationId: activeId }); } catch {}
    }
  }, [isConnected, socket, activeId]);

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
  }), [list, activeId, setActive, fetchConversations, loading, error]);

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