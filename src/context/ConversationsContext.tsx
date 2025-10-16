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
  historyLoadingId: string | null;
  notifyHistoryResolved: (conversationId: string) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  startNewConversation: (opts?: { auto?: boolean }) => Promise<void>;
  // Delete conversation helper: calls Next.js proxy which forwards to backend (NeonDB)
  deleteConversation: (conversationId: string) => Promise<boolean>;
  // Delete all conversations for the current user (requires explicit confirmation)
  deleteAllConversations: () => Promise<boolean>;
  unreadCounts: Record<string, number>;
  clearUnread: (conversationId: string) => void;
};

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

export function ConversationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { socket, isConnected } = useWebSocket();
  const [list, setList] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoadingId, setHistoryLoadingId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [deleteAllLoading, setDeleteAllLoading] = useState<boolean>(false);
  const pendingHistoryIdRef = useRef<string | null>(null);
  const lastFetchedUserIdRef = useRef<string | null>(null);

  const backendUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
    []
  );

  const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add optional `force` flag to allow explicit refresh after actions like delete
  const fetchConversations = useCallback(async (force = false) => {
    const userId = user?.id;
    if (!userId || (!force && userId === lastFetchedUserIdRef.current)) {
      return;
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
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => '');
        setError(`HTTP ${res.status}: ${res.statusText} ${t.slice(0, 120)}`);
        setLoading(false);
        return;
      }

      const data = await res.json();
      const rows: any[] = Array.isArray(data) ? data : [];

      // Normalize legacy model slugs (if conversation summaries include model)
      const legacyToNewModelMap: Record<string, string> = {
        'meta-llama/llama-3.2-3b-instruct': 'google/gemma-3-27b-it',
        'meta-llama/llama-3.3-8b-instruct:free': 'google/gemini-2.5-flash-lite',
        'meta-llama/llama-3.3-70b-instruct': 'google/gemini-2.5-flash'
      };

      const normalizedRows = rows.map((r: any) => {
        if (r && typeof r === 'object' && r.model && legacyToNewModelMap[r.model]) {
          return { ...r, model: legacyToNewModelMap[r.model] };
        }
        return r;
      });

      setList(normalizedRows);

      // Persist fixes back to backend for any changed models (best-effort; non-blocking)
      (async () => {
        try {
          const updates = normalizedRows
            .map((r: any, i: number) => ({ newRow: r, oldRow: rows[i] }))
            .filter(pair => pair.oldRow && pair.oldRow.model && pair.oldRow.model !== pair.newRow.model);

          await Promise.all(updates.map(async (pair) => {
            try {
              await fetch(`${backendUrl}/api/conversations/${pair.newRow.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ model: pair.newRow.model })
              });
            } catch (e) {
              console.warn('Failed to PATCH conversation model for', pair.newRow.id, e);
            }
          }));
        } catch (e) {
          // ignore
        }
      })();

      // Validates existing localStorage conversation id
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
  }, [backendUrl, user?.id]);

  // Initial fetch when user becomes available
  useEffect(() => {
    if (user?.id) {
      void fetchConversations();
    } else {
      setList([]);
      setActiveId(null);
      lastFetchedUserIdRef.current = null;
    }
  }, [user?.id, fetchConversations]);

  // Guarded emit for load_history: only when activeId changes or reconnects, and no pending for that id
  useEffect(() => {
    // Only attempt to load history when we have an active conversation and an established socket connection
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
  }, [activeId, socket, isConnected]);

  // If we attempted to load history before the socket was connected, resend on reconnect.
  useEffect(() => {
    if (!socket || !isConnected) return;
    if (!historyLoadingId || !activeId) return;
    // If the conversation we are waiting for is still the active one, re-emit load_history
    if (historyLoadingId === activeId) {
      try {
        socket.emit('load_history', { conversationId: activeId });
      } catch (e) {
        // ignore; WebSocketContext will handle connection problems
      }
    }
  }, [isConnected, socket, historyLoadingId, activeId]);

  // Clear pending on disconnect
  useEffect(() => {
    if (!isConnected) {
      pendingHistoryIdRef.current = null;
      setHistoryLoadingId(null);
    }
  }, [isConnected]);

  // Increment unread counts when WebSocket notifies of new messages
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (data: { conversationId: string; messageId?: string }) => {
      const convId = data.conversationId;
      // If the message is for the currently active conversation, don't increment
      setUnreadCounts(prev => {
        if (convId === activeId) {
          return prev;
        }
        const next = { ...prev, [convId]: (prev[convId] || 0) + 1 };
        return next;
      });
    };

    socket.on('message_received', handleMessageReceived);
    return () => {
      socket.off('message_received', handleMessageReceived);
    };
  }, [socket, activeId]);

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
    // Clear unread for this conversation when activated
    setUnreadCounts(prev => {
      if (!prev[id]) return prev;
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatConversationId', id);
    }
  }, [activeId, list]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const startNewConversation = useCallback(async (opts?: { auto?: boolean }) => {
    const isAuto = opts?.auto;
    const isAuthenticated = !!user?.id;
    let tempId = generateTempId();
    const placeholder: ConversationSummary = {
      id: tempId,
      title: 'New Chat',
      updated_at: new Date().toISOString(),
      message_count: 0,
      persona_id: null, // Will be set later
    };

    if (!isAuthenticated) {
      console.warn('🚫 startNewConversation blocked: user not authenticated');
      if (!isAuto) {
        setError('Authentication required to create a new conversation');
      }
      return;
    }

    if (!socket || !isConnected) {
      console.warn('🚫 startNewConversation blocked: socket not ready');
      if (!isAuto) {
        setError('Connection required to create conversation');
      }
      return;
    }

    // Optimistically add placeholder
    setList(prev => [placeholder, ...prev]);
    setActiveId(tempId);
    setHistoryLoadingId(tempId); // Show loading for new

    try {
      socket.emit('create_conversation', {
        title: 'New Chat',
        persona_id: null, // Default or from context
      });
      // Wait for 'conversation_created' to replace placeholder
    } catch (e) {
      console.error('Failed to emit create_conversation', e);
    }

    // Reset messages (via callback or context if integrated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatConversationId', tempId);
    }

    // Clear history loading after timeout if no response
    setTimeout(() => {
      if (historyLoadingId === tempId) {
        setHistoryLoadingId(null);
      }
    }, 5000);
  }, [user?.id, socket, isConnected, historyLoadingId]);

  // Load initial conversation on mount
  useEffect(() => {
    if (list.length === 0 && user?.id) {
      void startNewConversation({ auto: true });
    }
  }, [list.length, startNewConversation, user?.id]);

  // Listen for conversation_created
  useEffect(() => {
    if (!socket) return;

    const handleConversationCreated = (data: { conversationId: string; userId: string }) => {
      console.log('🆕 Conversation created:', data.conversationId);
      // Replace placeholder if temp id matches
      setList(prev => prev.map(conv => 
        conv.id.startsWith('temp-') ? { ...conv, id: data.conversationId } : conv
      ));
      setActiveId(data.conversationId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('chatConversationId', data.conversationId);
      }
      setHistoryLoadingId(null);
    };

    socket.on('conversation_created', handleConversationCreated);
    return () => {
      socket.off('conversation_created', handleConversationCreated);
    };
  }, [socket]);

  const value: ConversationsContextType = useMemo(() => ({
    list,
    activeId,
    setActive,
    refresh: fetchConversations,
    loading,
    error,
    historyLoadingId,
    notifyHistoryResolved,
    sidebarOpen,
    toggleSidebar,
    startNewConversation,
    // Delete conversation helper: calls Next.js proxy which forwards to backend (NeonDB)
    deleteConversation: async (conversationId: string) => {
      try {
        const token = await getNeonAuthToken();
        const res = await fetch(`/api/conversations/${conversationId}`, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });

        if (res.status === 204 || res.ok) {
          // If deleted conversation was active, clear local storage and active state
          if (conversationId === activeId) {
            setActiveId(null);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('chatConversationId');
            }
            setHistoryLoadingId(null);
          }
          // Remove unread count
          setUnreadCounts(prev => {
            if (!prev[conversationId]) return prev;
            const copy = { ...prev };
            delete copy[conversationId];
            return copy;
          });
          // Refresh listing
          await fetchConversations(true);
          return true;
        } else {
          console.error('Failed to delete conversation via proxy', res.status);
          return false;
        }
      } catch (e) {
        console.error('deleteConversation error', e);
        return false;
      }
    },
    // Delete all conversations for the current user (requires explicit confirmation)
    deleteAllConversations: async () => {
      if (!user?.id) {
        console.warn('deleteAllConversations blocked: no authenticated user');
        return false;
      }

      if (deleteAllLoading) return false;
      const confirmed = window.confirm('Delete ALL your conversations? This action is irreversible. Click OK to proceed.');
      if (!confirmed) return false;

      setDeleteAllLoading(true);
      try {
        const token = await getNeonAuthToken();
        const url = `/api/conversations?confirm=true`;
        const res = await fetch(url, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
        });

        if (res.status === 204 || res.ok) {
          // Clear local state
          setList([]);
          setActiveId(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('chatConversationId');
          }
          setHistoryLoadingId(null);
          setUnreadCounts({});
          // Ensure we refresh to reflect server state
          await fetchConversations(true);
          return true;
        } else {
          const text = await res.text().catch(() => '');
          console.error('Failed to delete all conversations', res.status, text);
          return false;
        }
      } catch (e) {
        console.error('deleteAllConversations error', e);
        return false;
      } finally {
        setDeleteAllLoading(false);
      }
    },
    unreadCounts,
    clearUnread: (conversationId: string) => {
      setUnreadCounts(prev => {
        if (!prev[conversationId]) return prev;
        const copy = { ...prev };
        delete copy[conversationId];
        return copy;
      });
    }
  }), [list, activeId, setActive, fetchConversations, loading, error, historyLoadingId, notifyHistoryResolved, sidebarOpen, toggleSidebar, startNewConversation, unreadCounts]);

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