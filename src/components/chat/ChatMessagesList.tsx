'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useWebSocket } from '@/context/WebSocketContext';
import { useConversations } from '@/context/ConversationsContext';
import { reportEvent, reportError } from '@/lib/telemetry';
import MessageBubble from '../MessageBubble';
import TypingIndicator from '../TypingIndicator';
import { Message } from '@/types/chat';
import EmptyChatState from './EmptyChatState';

export type ChatMessagesListProps = {
  conversationId: string | null;
  isConnected: boolean;
  isAuthenticated: boolean;
};

/**
 * ChatMessagesList
 *
 * - Virtualized list using react-virtuoso.
 * - Reads persisted history from ConversationsContext.messages and keeps a local view
 *   synchronized with streaming updates (deltas/finals) and server-emitted messages.
 * - Deduplicates by message.id and updates the ConversationsContext store via addMessage when appropriate.
 *
 * Production hardening added:
 * - Safe JSON repair attempt for structured model outputs (best-effort)
 * - Backpressure protection: per-message partial buffer size cap
 * - Lightweight metrics counters (console-reported)
 */
export default function ChatMessagesList({
  conversationId,
  isConnected,
}: ChatMessagesListProps) {
  const { socket } = useWebSocket();
  const conv = useConversations();

  // Local visible messages (initialized from conv.messages[conversationId])
  const [messages, setMessages] = useState<Message[]>([]);
  const partialsRef = useRef<Record<string, string>>({});
  const [isTyping, setIsTyping] = useState(false);

  // Lightweight in-memory metrics (not persisted)
  const metricsRef = useRef({
    jsonRepairFailures: 0,
    partialOverflowCount: 0,
    totalDeltasReceived: 0,
    totalFinalsReceived: 0,
  });

  const MAX_PARTIAL_LENGTH = 200_000; // safety cap for streaming partials

  // Simple best-effort JSON repair: try JSON.parse, else attempt to extract largest {...} substring
  const safeParseJson = (text: string): any | null => {
    try {
      return JSON.parse(text);
    } catch {
      // attempt heuristic: find first '{' and last '}' and parse substring
      const first = text.indexOf('{');
      const last = text.lastIndexOf('}');
      if (first !== -1 && last !== -1 && last > first) {
        const candidate = text.slice(first, last + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          metricsRef.current.jsonRepairFailures += 1;
          return null;
        }
      }
      metricsRef.current.jsonRepairFailures += 1;
      return null;
    }
  };

  // Helper: merge in messages with dedupe by id, preserving order
  const mergeMessages = (incoming: Message[]) => {
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const merged = [...prev];
      for (const msg of incoming) {
        if (!seen.has(msg.id)) {
          merged.push(msg);
          seen.add(msg.id);
        }
      }
      return merged;
    });
  };

  // Initialize messages from persisted store when conversationId or persisted messages change
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    const persisted = conv.messages?.[conversationId] ?? [];
    setMessages(persisted);
    // Reset partials and typing flag for a fresh conversation
    partialsRef.current = {};
    setIsTyping(false);
  }, [conversationId, conv.messages]);

  // If there is no active conversation or it has no messages, show the empty/hero state
  if (!conversationId || messages.length === 0) {
    return (
      <div className="flex-1">
        <EmptyChatState />
      </div>
    );
  }

  useEffect(() => {
    if (!socket) return;

    const handleHistory = (data: any) => {
      try {
        const convId = data.conversationId || data.id || data.conversation_id || null;
        const rows: any[] = Array.isArray(data) ? data : data.messages || data.history || [];
        if (!convId || !rows) return;
        const mapped: Message[] = rows.map((r) => ({
          id: r.id || r.message_id || String(Math.random()),
          type: r.sender === 'user' || r.role === 'user' ? 'user' : 'assistant',
          content: String(r.text ?? r.content ?? ''),
          timestamp: typeof r.ts === 'number' ? r.ts : Date.parse(r.created_at ?? r.ts ?? '') || Date.now(),
        }));
        // update local view only if this history is for current conversation
        if (convId === conversationId) {
          setMessages(mapped);
        }
        // persist into central store (adapter)
        conv.setConversationMessages?.(convId, mapped);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('ChatMessagesList.handleHistory parse error', err);
      }
    };

    const handleDelta = (payload: any) => {
      try {
        metricsRef.current.totalDeltasReceived += 1;
        const msgId = payload.message_id || payload.id || payload.idempotency_key || `stream-${Date.now()}`;
        const chunk = payload.chunk ?? payload.text ?? payload.delta ?? '';
        const convId = payload.conversationId || payload.conversation_id || payload.conversation || null;

        setIsTyping(true);
        partialsRef.current[msgId] = (partialsRef.current[msgId] || '') + String(chunk);

        // Backpressure protection: if partial exceeds limit, finalize and drop further deltas
        if (partialsRef.current[msgId].length > MAX_PARTIAL_LENGTH) {
          metricsRef.current.partialOverflowCount += 1;
          // commit current partial as final (best-effort)
          const finalContent = partialsRef.current[msgId].slice(0, MAX_PARTIAL_LENGTH);
          const finalMsg: Message = {
            id: msgId,
            type: 'assistant',
            content: finalContent,
            timestamp: Date.now(),
          };
          // persist and update local
          if (convId) conv.addMessage?.(convId, finalMsg);
          setMessages((prev) => (prev.find((m) => m.id === msgId) ? prev : [...prev, finalMsg]));
          // clear buffer and stop accepting more for this id
          delete partialsRef.current[msgId];
          setIsTyping(false);
          return;
        }

        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === msgId);
          const contentVal = partialsRef.current[msgId];
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], content: contentVal, timestamp: copy[idx].timestamp || Date.now() } as Message;
            return copy;
          }
          const newMsg: Message = { id: msgId, type: 'assistant', content: contentVal, timestamp: Date.now() };
          // persist optimistic partial as a message (but won't be marked complete yet)
          if (convId) conv.addMessage?.(convId, newMsg);
          return [...prev, newMsg];
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('ChatMessagesList.handleDelta error', err);
      }
    };

    const handleFinal = (payload: any) => {
      try {
        metricsRef.current.totalFinalsReceived += 1;
        const msgId = payload.message_id || payload.id || `stream-${Date.now()}`;
        const convId = payload.conversationId || payload.conversation_id || payload.conversation || null;
        let finalText = payload.text ?? payload.chunk ?? partialsRef.current[msgId] ?? '';

        // If server returned structured JSON inside text, attempt best-effort repair + extraction
        if (typeof finalText === 'string' && finalText.trim().startsWith('{')) {
          // run repair in async IIFE so we can use await safely
          (async () => {
            try {
              const mod = await import('jsonrepair').catch(() => null);
              const repairFn = mod ? (mod.jsonrepair ?? mod) : null;
              if (repairFn && typeof repairFn === 'function') {
                const repaired = repairFn(finalText);
                try {
                  const parsed = JSON.parse(repaired);
                  if (parsed && parsed.text) {
                    finalText = String(parsed.text);
                  } else if (parsed && typeof parsed === 'object') {
                    finalText = String(parsed.output ?? parsed.result ?? JSON.stringify(parsed));
                  }
                } catch {
                  // If JSON.parse still fails, fallback to repaired string as best-effort
                  finalText = String(repaired);
                  void reportEvent('jsonrepair_used', { conversationId: convId, messageId: msgId });
                }
              } else {
                // fallback to in-house heuristic
                const parsed = safeParseJson(finalText);
                if (parsed && parsed.text) {
                  finalText = String(parsed.text);
                } else if (parsed && typeof parsed === 'object') {
                  finalText = String(parsed.output ?? parsed.result ?? JSON.stringify(parsed));
                } else {
                  // record repair failure
                  metricsRef.current.jsonRepairFailures += 1;
                  void reportEvent('jsonrepair_failed', { conversationId: convId, messageId: msgId });
                }
              }
            } catch (err) {
              metricsRef.current.jsonRepairFailures += 1;
              void reportError(err, { conversationId: convId, messageId: msgId, stage: 'final_repair' });
            }
          })();
        }

        // commit final text
        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === msgId);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], content: finalText, timestamp: copy[idx].timestamp || Date.now() } as Message;
            return copy;
          }
          const newMsg: Message = { id: msgId, type: 'assistant', content: finalText, timestamp: Date.now() };
          if (convId) conv.addMessage?.(convId, newMsg);
          return [...prev, newMsg];
        });

        delete partialsRef.current[msgId];
        setIsTyping(false);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('ChatMessagesList.handleFinal error', err);
        void reportError(err, { stage: 'handleFinal' });
      }
    };

    const handleMessage = (payload: any) => {
      try {
        const convId = payload.conversationId || payload.conversation_id || payload.conversation || null;
        if (!convId) return;
        const contentCandidate = payload.text ?? payload.content ?? '';
        let content = String(contentCandidate);
        // If content is JSON-like, attempt repair with jsonrepair if available
        if (typeof content === 'string' && content.trim().startsWith('{')) {
          (async () => {
            try {
              const mod = await import('jsonrepair').catch(() => null);
              const repairFn = mod ? (mod.jsonrepair ?? mod) : null;
              if (repairFn && typeof repairFn === 'function') {
                const repaired = repairFn(content);
                try {
                  const parsed = JSON.parse(repaired);
                  if (parsed && parsed.text) {
                    content = String(parsed.text);
                  } else if (parsed && typeof parsed === 'object') {
                    content = String(parsed.output ?? parsed.result ?? JSON.stringify(parsed));
                  }
                } catch {
                  content = repaired;
                  void reportEvent('jsonrepair_used_for_message', { conversationId: convId, messageId: payload.id || payload.message_id });
                }
              } else {
                const parsed = safeParseJson(content);
                if (parsed && parsed.text) {
                  content = String(parsed.text);
                } else if (parsed && typeof parsed === 'object') {
                  content = String(parsed.output ?? parsed.result ?? JSON.stringify(parsed));
                } else {
                  metricsRef.current.jsonRepairFailures += 1;
                  void reportEvent('jsonrepair_failed_for_message', { conversationId: convId, messageId: payload.id || payload.message_id });
                }
              }
            } catch (err) {
              void reportError(err, { stage: 'message_repair', conversationId: convId, messageId: payload.id || payload.message_id });
            }
          })();
        }
        const msg: Message = {
          id: payload.id || payload.message_id || String(Math.random()),
          type: payload.type || payload.role || (payload.sender === 'user' ? 'user' : 'assistant'),
          content,
          timestamp: typeof payload.ts === 'number' ? payload.ts : Date.parse(payload.created_at ?? '') || Date.now(),
        };
        // Add to local view if for current conversation
        if (convId === conversationId) {
          setMessages((prev) => (prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]));
        }
        // Persist centrally
        conv.addMessage?.(convId, msg);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('ChatMessagesList.handleMessage error', err);
        void reportError(err, { stage: 'handleMessage' });
      }
    };

    socket.on('history', handleHistory);
    socket.on('history_loaded', handleHistory);

    socket.on('assistant_delta', handleDelta);
    socket.on('assistant_chunk', handleDelta);
    socket.on('assistant_partial', handleDelta);

    socket.on('assistant_final', handleFinal);
    socket.on('assistant_complete', handleFinal);
    socket.on('assistant_message', handleFinal);

    socket.on('message', handleMessage);
    socket.on('message_received', handleMessage);

    return () => {
      socket.off('history', handleHistory);
      socket.off('history_loaded', handleHistory);

      socket.off('assistant_delta', handleDelta);
      socket.off('assistant_chunk', handleDelta);
      socket.off('assistant_partial', handleDelta);

      socket.off('assistant_final', handleFinal);
      socket.off('assistant_complete', handleFinal);
      socket.off('assistant_message', handleFinal);

      socket.off('message', handleMessage);
      socket.off('message_received', handleMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, conversationId, isConnected, conv]);

  const itemContent = (index: number, item: Message) => {
    return <MessageBubble key={item.id} message={item} />;
  };

  const components = useMemo(
    () => ({
      Footer: () => (isTyping ? <TypingIndicator isVisible={true} countryName={undefined} /> : null),
    }),
    [isTyping]
  );

  // Periodically log simple metrics for monitoring (best-effort, low frequency)
  useEffect(() => {
    const t = setInterval(() => {
      const m = metricsRef.current;
      if (m.jsonRepairFailures || m.partialOverflowCount) {
        // eslint-disable-next-line no-console
        console.warn('[chat-metrics]', { jsonRepairFailures: m.jsonRepairFailures, partialOverflowCount: m.partialOverflowCount, totalDeltasReceived: m.totalDeltasReceived, totalFinalsReceived: m.totalFinalsReceived });
      }
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ height: '60vh' }}>
      <Virtuoso
        data={messages}
        itemContent={itemContent}
        components={components}
        followOutput="auto"
      />
    </div>
  );
}