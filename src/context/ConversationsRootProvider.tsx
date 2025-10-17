'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Message } from '@/types/chat';
import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { getNeonAuthToken } from '@/lib/neonAuth';
import { getBackendUrl, apiFetch, Storage, showNotification } from '@/lib/shared';
import { ConversationDataContext } from './ConversationDataContext';
import { ConversationUIContext } from './ConversationUIContext';

type ConversationSummary = {
  id: string;
  title?: string | null;
  updated_at: string | Date;
  message_count?: number;
  persona_id?: string | null;
};

export function ConversationsRootProvider({ children }: { children: ReactNode }) {
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
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});

  const backendUrl = getBackendUrl();

  const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const setConversationMessages = useCallback((conversationId: string, msgs: Message[]) => {
    setMessagesMap(prev => ({ ...prev, [conversationId]: msgs }));
  }, []);

  const addMessage = useCallback((conversationId: string, msg: Message) => {
    setMessagesMap(prev => {
      const existing = prev[conversationId] ?? [];
      if (existing.find(m => m.id === msg.id)) return prev;
      return { ...prev, [conversationId]: [...existing, msg] };
    });
  }, []);

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

      const data = await apiFetch<any[]>('/api/conversations', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        }
      }, { retries: 2 });
      const rows: any[] = Array.isArray(data) ? data : [];

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

      (async () => {
        try {
          const updates = normalizedRows
            .map((r: any, i: number) => ({ newRow: r, oldRow: rows[i] }))
            .filter(pair => pair.oldRow && pair.oldRow.model && pair.oldRow.model !== pair.newRow.model);

          await Promise.all(updates.map(async (pair) => {
            try {
              await apiFetch(`/api/conversations/${pair.newRow.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ model: pair.newRow.model })
              }, { retries: 1 });
            } catch (e) {
              console.warn('Failed to PATCH conversation model for', pair.newRow.id, e);
            }
          }));
        } catch (e) {
          // ignore
        }
      })();

      const stored = Storage.get<string>('chatConversationId', null);
      if (stored && rows.some(r => r.id === stored)) {
        setActiveId(stored);
      } else if (rows.length > 0) {
        setActiveId(rows[0].id);
        Storage.set('chatConversationId', rows[0].id);
      } else {
        setActiveId(null);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, [backendUrl, user?.id]);

  useEffect(() => {
    if (user?.id) {
      void fetchConversations();
    } else {
      setList([]);
      setActiveId(null);
      lastFetchedUserIdRef.current = null;
    }
  }, [user?.id, fetchConversations]);

  useEffect(() => {
    if (!activeId || !socket || !isConnected) return;
    if (pendingHistoryIdRef.current === activeId) return;
    pendingHistoryIdRef.current = activeId;
    setHistoryLoadingId(activeId);
    try {
      socket.emit('load_history', { conversationId: activeId });
    } catch {
      pendingHistoryIdRef.current = null;
      setHistoryLoadingId(null);
    }
  }, [activeId, socket, isConnected]);

  useEffect(() => {
    if (!socket || !isConnected) return;
    if (!historyLoadingId || !activeId) return;
    if (historyLoadingId === activeId) {
      try {
        socket.emit('load_history', { conversationId: activeId });
      } catch {
        // ignore
      }
    }
  }, [isConnected, socket, historyLoadingId, activeId]);

  useEffect(() => {
    if (!isConnected) {
      pendingHistoryIdRef.current = null;
      setHistoryLoadingId(null);
    }
  }, [isConnected]);

  useEffect(() => {
    if (!socket) return;
    const handleMessageReceived = (data: { conversationId: string; messageId?: string }) => {
      const convId = data.conversationId;
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
      persona_id: null,
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

    if (isAuto) {
      console.log('⏭️  Auto-creation skipped: conversation will be created on first message send');
      return;
    }

    setList(prev => [placeholder, ...prev]);
    setActiveId(tempId);
    setHistoryLoadingId(tempId);

    try {
      socket.emit('create_conversation', {
        title: 'New Chat',
        persona_id: null,
      });
    } catch (e) {
      console.error('Failed to emit create_conversation', e);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('chatConversationId', tempId);
    }

    setTimeout(() => {
      if (historyLoadingId === tempId) {
        setHistoryLoadingId(null);
      }
    }, 5000);
  }, [user?.id, socket, isConnected, historyLoadingId]);

  useEffect(() => {
    if (list.length === 0 && user?.id) {
      void startNewConversation({ auto: true });
    }
  }, [list.length, startNewConversation, user?.id]);

  useEffect(() => {
    if (!socket) return;

    const handleConversationCreated = (data: { conversationId: string; userId: string }) => {
      console.log('🆕 Conversation created:', data.conversationId);
      setList(prev => prev.map(conv => conv.id.startsWith('temp-') ? { ...conv, id: data.conversationId } : conv));
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

  useEffect(() => {
    if (!socket) return;

    const handleHistory = (data: any) => {
      try {
        if (!data) return;
        const convId = data.conversationId || data.id || data.conversation_id || null;
        const rows: any[] = Array.isArray(data) ? data : data.messages || data.history || [];
        if (!convId || !rows) return;
        const mapped: Message[] = rows.map((r) => ({
          id: r.id || r.message_id || String(Math.random()),
          type: r.sender === 'user' || r.role === 'user' ? 'user' : 'assistant',
          content: String(r.text ?? r.content ?? ''),
          timestamp: typeof r.ts === 'number' ? r.ts : Date.parse(r.created_at ?? r.ts ?? '') || Date.now(),
        }));
        setConversationMessages(convId, mapped);
        if (pendingHistoryIdRef.current === convId) {
          pendingHistoryIdRef.current = null;
          setHistoryLoadingId(null);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('ConversationsRootProvider.handleHistory parse error', err);
      }
    };

    const handleMessage = (payload: any) => {
      try {
        const convId = payload.conversationId || payload.conversation_id || payload.conversation || null;
        if (!convId) return;
        const msg: Message = {
          id: payload.id || payload.message_id || String(Math.random()),
          type: payload.type || payload.role || (payload.sender === 'user' ? 'user' : 'assistant'),
          content: String(payload.text ?? payload.content ?? ''),
          timestamp: typeof payload.ts === 'number' ? payload.ts : Date.parse(payload.created_at ?? '') || Date.now(),
        };
        addMessage(convId, msg);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('ConversationsRootProvider.handleMessage error', err);
      }
    };

    socket.on('history', handleHistory);
    socket.on('history_loaded', handleHistory);
    socket.on('message', handleMessage);
    socket.on('message_received', handleMessage);

    return () => {
      socket.off('history', handleHistory);
      socket.off('history_loaded', handleHistory);
      socket.off('message', handleMessage);
      socket.off('message_received', handleMessage);
    };
  }, [socket, setConversationMessages, addMessage]);

  const valueForData = useMemo(() => ({
    list,
    messages: messagesMap,
    fetchConversations,
    addMessage,
    setConversationMessages,
    deleteConversation: async (conversationId: string) => {
      try {
        const token = await getNeonAuthToken();
        try {
          await apiFetch(`/api/conversations/${conversationId}`, {
            method: 'DELETE',
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
          }, { retries: 1 });

          if (conversationId === activeId) {
            setActiveId(null);
            Storage.clear('chatConversationId');
            setHistoryLoadingId(null);
          }
          setUnreadCounts(prev => {
            if (!prev[conversationId]) return prev;
            const copy = { ...prev };
            delete copy[conversationId];
            return copy;
          });
          await fetchConversations(true);
          return true;
        } catch (err) {
          console.error('Failed to delete conversation via proxy', err);
          return false;
        }
      } catch (e) {
        console.error('deleteConversation error', e);
        return false;
      }
    },
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
        try {
          await apiFetch('/api/conversations?confirm=true', {
            method: 'DELETE',
            headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
          }, { retries: 1 });
          setList([]);
          setActiveId(null);
          Storage.clear('chatConversationId');
          setHistoryLoadingId(null);
          setUnreadCounts({});
          await fetchConversations(true);
          return true;
        } catch (err) {
          console.error('Failed to delete all conversations', err);
          showNotification('Failed to delete conversations', 'error');
          return false;
        }
      } catch (e) {
        console.error('deleteAllConversations error', e);
        return false;
      } finally {
        setDeleteAllLoading(false);
      }
    },
  }), [list, messagesMap, fetchConversations, addMessage, setConversationMessages, deleteAllLoading, activeId, user?.id]);

  const valueForUI = useMemo(() => ({
    activeId,
    setActive,
    sidebarOpen,
    toggleSidebar,
    unreadCounts,
    clearUnread: (conversationId: string) => {
      setUnreadCounts(prev => {
        if (!prev[conversationId]) return prev;
        const copy = { ...prev };
        delete copy[conversationId];
        return copy;
      });
    },
    historyLoadingId,
    notifyHistoryResolved,
    startNewConversation,
  }), [activeId, setActive, sidebarOpen, toggleSidebar, unreadCounts, historyLoadingId, notifyHistoryResolved, startNewConversation]);

  return (
    <ConversationDataContext.Provider value={valueForData}>
      <ConversationUIContext.Provider value={valueForUI}>
        {children}
      </ConversationUIContext.Provider>
    </ConversationDataContext.Provider>
  );
}