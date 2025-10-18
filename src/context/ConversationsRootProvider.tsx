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

// -----------------------------------------------------------------------------
// Investigation & Mitigation Plan (instrumented into file)
//
// Plan Summary (React #310 Auth Crash Investigation)
// 1. Instrument: add temporary console counters/timestamps around both `load_history` emits,
//    `setHistoryLoadingId`, and `pendingHistoryIdRef` transitions in
//    [`ConversationsRootProvider.tsx`](klkfront/src/context/ConversationsRootProvider.tsx:186-209)
//    to prove the re-trigger loop.
// 2. Audit Effects: review `fetchConversations` init effect, history loader effect, and socket
//    handlers to ensure state updates aren't cycling their dependencies.
// 3. Analyze Auth Flow: trace `getNeonAuthToken`, `lastFetchedUserIdRef`, and localStorage usage
//    for redundant updates when authenticated sessions initialize.
// 4. Remediation Options: compare tighter guards versus ref-based "in-flight" control to prevent
//    duplicate history emits; select the safest fix.
// 5. Validation Plan: define regression checks for authed/guest chat, empty state, optimistic messaging,
//    and finish with `pnpm run build`, documenting the mitigation in the memory bank before implementation.
// -----------------------------------------------------------------------------
// Temporary instrumentation below. Remove once investigation is complete.

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
  // --- Instrumentation: history & auth metrics for debugging React #310 ---
  const historyMetricsRef = useRef({
    emits_total: 0,
    emits_effect_activeId: 0,
    emits_effect_historyLoadingId: 0,
    historyResolved: 0,
    fetchConversationsCalls: 0,
    localStorageWrites: 0,
  });
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  // Sidebar collapsed state (persisted) — expose via ConversationUIContext so UI components can react
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false;
      const stored = localStorage.getItem('sidebar-collapsed');
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
      }
    } catch {
      // ignore persistence errors
    }
  }, [isSidebarCollapsed]);

  const toggleSidebarCollapsed = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  const backendUrl = getBackendUrl();

  const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Helper: generate a short title from a message text
  const generateTitleFromText = (text?: string) => {
    if (!text) return 'Conversation';
    const cleaned = String(text).trim().replace(/\s+/g, ' ');
    const words = cleaned.split(' ').slice(0, 6);
    const candidate = words.join(' ');
    return candidate.length > 0 ? (candidate.charAt(0).toUpperCase() + candidate.slice(1)) : 'Conversation';
  };

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
    historyMetricsRef.current.fetchConversationsCalls += 1;
    console.debug('[ConversationsRoot] fetchConversations start', { userId: user?.id, force, calls: historyMetricsRef.current.fetchConversationsCalls, lastFetchedUserId: lastFetchedUserIdRef.current });
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
      console.debug('[ConversationsRoot] Storage.get chatConversationId ->', stored);
      if (stored && rows.some(r => r.id === stored)) {
        setActiveId(stored);
      } else if (rows.length > 0) {
        setActiveId(rows[0].id);
        Storage.set('chatConversationId', rows[0].id);
        historyMetricsRef.current.localStorageWrites += 1;
        console.debug('[ConversationsRoot] Storage.set chatConversationId ->', rows[0].id, 'totalWrites:', historyMetricsRef.current.localStorageWrites);
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
    // Only depend on user?.id to avoid effect re-running due to fetchConversations identity changes.
    if (user?.id) {
      // Call the memoized fetchConversations from inside an async IIFE to avoid
      // placing the function reference into the effect dependency array.
      (async () => {
        try {
          await fetchConversations();
        } catch (err) {
          // swallowing here is fine; fetchConversations sets its own error state
        }
      })();
    } else {
      setList([]);
      setActiveId(null);
      lastFetchedUserIdRef.current = null;
    }
  }, [user?.id]);

  useEffect(() => {
    // Guard #1: activeId-driven history load (emitter 1)
    if (!activeId || !socket || !isConnected) return;
    if (pendingHistoryIdRef.current === activeId) {
      console.debug('[ConversationsRoot] Skipping emit (pendingHistoryIdRef matches activeId)', { activeId, pending: pendingHistoryIdRef.current });
      return;
    }
    pendingHistoryIdRef.current = activeId;
    setHistoryLoadingId(activeId);
    try {
      historyMetricsRef.current.emits_total += 1;
      historyMetricsRef.current.emits_effect_activeId += 1;
      console.debug('[ConversationsRoot] Emitting load_history (effect activeId) ', { activeId, metrics: historyMetricsRef.current });
      socket.emit('load_history', { conversationId: activeId });
    } catch (e) {
      console.warn('[ConversationsRoot] emit(load_history) failed (effect activeId)', { activeId, error: e });
      pendingHistoryIdRef.current = null;
      setHistoryLoadingId(null);
    }
  }, [activeId, socket, isConnected]);

  useEffect(() => {
    // Guard #2: historyLoadingId-driven retry emitter (emitter 2)
    if (!socket || !isConnected) return;
    if (!historyLoadingId || !activeId) return;
    if (historyLoadingId === activeId) {
      try {
        // Defensive: ensure we don't cause repeated emits if pending flag shows in-flight
        if (pendingHistoryIdRef.current === activeId) {
          console.debug('[ConversationsRoot] Skipping emit (pending flag set) in historyLoadingId effect', { activeId, historyLoadingId });
          return;
        }
        historyMetricsRef.current.emits_total += 1;
        historyMetricsRef.current.emits_effect_historyLoadingId += 1;
        console.debug('[ConversationsRoot] Emitting load_history (effect historyLoadingId) ', { activeId, historyLoadingId, metrics: historyMetricsRef.current });
        socket.emit('load_history', { conversationId: activeId });
      } catch (e) {
        console.warn('[ConversationsRoot] emit(load_history) failed (historyLoadingId effect)', { activeId, historyLoadingId, error: e });
      }
    }
  }, [isConnected, socket, historyLoadingId, activeId]);

  // Temporary selected country for UI when conversation not yet created
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  // Global quick-search UI flag (toggled by sidebar quick actions)
  const [searchOpen, setSearchOpen] = useState<boolean>(false);

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
    // mark resolution in instrumentation and clear flags
    if (pendingHistoryIdRef.current === conversationId) {
      pendingHistoryIdRef.current = null;
      historyMetricsRef.current.historyResolved += 1;
      console.debug('[ConversationsRoot] notifyHistoryResolved cleared pendingHistoryIdRef', { conversationId, metrics: historyMetricsRef.current });
    }
    if (historyLoadingId === conversationId) {
      setHistoryLoadingId(null);
      console.debug('[ConversationsRoot] notifyHistoryResolved cleared historyLoadingId', { conversationId, metrics: historyMetricsRef.current });
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
      historyMetricsRef.current.localStorageWrites += 1;
      console.debug('[ConversationsRoot] setActive persisted chatConversationId', { id, localWrites: historyMetricsRef.current.localStorageWrites });
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
      persona_id: selectedCountry ?? null,
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
        persona_id: selectedCountry ?? null,
      });
    } catch (e) {
      console.error('Failed to emit create_conversation', e);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('chatConversationId', tempId);
      historyMetricsRef.current.localStorageWrites += 1;
      console.debug('[ConversationsRoot] startNewConversation tempId assigned & persisted', { tempId, localWrites: historyMetricsRef.current.localStorageWrites });
    }

    setTimeout(() => {
      if (historyLoadingId === tempId) {
        setHistoryLoadingId(null);
      }
    }, 5000);
  }, [user?.id, socket, isConnected, historyLoadingId, selectedCountry]);

  // NOTE: Automatic conversation creation on mount/list-empty was removed.
  // Creating a conversation eagerly here caused a render-loop: the effect would
  // call startNewConversation -> setList (mutates list) -> effect re-runs.
  // Conversation creation is intentionally lazy now: a conversation is created
  // only when the user sends their first message (see ChatInputSection).
  // If a future UX requires auto-creation, implement a guarded, once-only trigger
  // (for example a ref that ensures the creation runs at most once) to avoid cycles.

  useEffect(() => {
    if (!socket) return;

    const handleConversationCreated = (data: { conversationId: string; userId: string }) => {
      console.log('🆕 Conversation created:', data.conversationId);
      setList(prev => prev.map(conv => conv.id.startsWith('temp-') ? { ...conv, id: data.conversationId } : conv));
      setMessagesMap(prev => {
        const tempEntry = Object.entries(prev).find(([key]) => key.startsWith('temp-'));
        if (!tempEntry) return prev;
        const [tempIdKey, tempMessages] = tempEntry;
        const { [tempIdKey]: _, ...rest } = prev;
        return { ...rest, [data.conversationId]: tempMessages };
      });
      setActiveId(data.conversationId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('chatConversationId', data.conversationId);
      }
      setHistoryLoadingId(null);

      // Persist selected country for the new conversation if one was chosen
      if (selectedCountry) {
        void (async () => {
          try {
            const token = await getNeonAuthToken();
            await apiFetch(`/api/conversations/${data.conversationId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify({ persona_id: selectedCountry })
            }, { retries: 1 });
          } catch (err) {
            console.warn('Failed to persist persona on new conversation', err);
          }
        })();
      }
    };

    socket.on('conversation_created', handleConversationCreated);
    return () => {
      socket.off('conversation_created', handleConversationCreated);
    };
  }, [socket, selectedCountry]);

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

        // Auto-rename conversation on first real user message when title is placeholder
        try {
          // estimate new message count (current local count + 1)
          const prevCount = (messagesMap as any)[convId]?.length ?? 0;
          const newCount = prevCount + 1;
          const conv = list.find(c => c.id === convId);
          const isPlaceholderTitle = !conv?.title || conv?.title === '' || conv?.title === 'New Chat';
          // Only consider user messages (not assistant) and only when this will be the first message
          if (msg.type === 'user' && newCount === 1 && isPlaceholderTitle) {
            const newTitle = generateTitleFromText(msg.content);
            // Optimistic update of local list
            setList(prev => prev.map(c => c.id === convId ? { ...c, title: newTitle, updated_at: new Date().toISOString() } : c));
            // Persist rename via proxy
            (async () => {
              try {
                const token = await getNeonAuthToken();
                await apiFetch(`/api/conversations/${convId}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                  },
                  body: JSON.stringify({ title: newTitle })
                }, { retries: 1 });
              } catch (err) {
                console.warn('Auto-rename failed for conversation', convId, err);
                // Reconcile with server truth
                try { await fetchConversations(true); } catch {}
              }
            })();
          }
        } catch (err) {
          console.warn('Auto-rename check failed', err);
        }
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
    renameConversation: async (conversationId: string, title: string) => {
      if (!conversationId) return false;
      // Optimistic update
      setList(prev => prev.map(c => c.id === conversationId ? { ...c, title, updated_at: new Date().toISOString() } : c));
      try {
        const token = await getNeonAuthToken();
        await apiFetch(`/api/conversations/${conversationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ title })
        }, { retries: 1 });
        // Refresh list to ensure server truth
        await fetchConversations(true);
        return true;
      } catch (err) {
        console.error('Failed to rename conversation', err);
        // Re-fetch to revert optimistic change
        await fetchConversations(true);
        return false;
      }
    },
  }), [list, messagesMap, fetchConversations, addMessage, setConversationMessages, deleteAllLoading, activeId, user?.id]);

  const valueForUI = useMemo(() => ({
    activeId,
    setActive,
    sidebarOpen,
    toggleSidebar,
    isSidebarCollapsed,
    setSidebarCollapsed: (v: boolean) => setIsSidebarCollapsed(v),
    toggleSidebarCollapsed,
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
    // expose temporary selectedCountry for pre-conversation state
    selectedCountry,
    setSelectedCountry,
    // expose search UI flag and setter for quick actions
    searchOpen,
    setSearchOpen,
  }), [activeId, setActive, sidebarOpen, toggleSidebar, unreadCounts, historyLoadingId, notifyHistoryResolved, startNewConversation, isSidebarCollapsed, toggleSidebarCollapsed, selectedCountry]);

  return (
    <ConversationDataContext.Provider value={valueForData}>
      <ConversationUIContext.Provider value={valueForUI}>
        {children}
      </ConversationUIContext.Provider>
    </ConversationDataContext.Provider>
  );
}