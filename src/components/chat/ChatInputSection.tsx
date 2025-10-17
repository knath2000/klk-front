'use client';

import React, { useEffect, useRef } from 'react';
import ChatInput from '../ChatInput';
import { useConversations } from '@/context/ConversationsContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { useConversationUI } from '@/context/ConversationUIContext';
import type { Message } from '@/types/chat';

export type ChatInputSectionProps = {
  conversationId: string | null;
  onSend?: (msg: string) => void;
  disabled?: boolean;
  selectedCountry?: string | null;
};

/**
 * ChatInputSection - thin wrapper around ChatInput.
 * Adds lazy conversation creation and message send via socket.
 */
export default function ChatInputSection({
  conversationId,
  onSend,
  disabled = false,
  selectedCountry = null,
}: ChatInputSectionProps): React.ReactElement {
  const conv = useConversations();
  const { socket, isConnected } = useWebSocket();
  const ui = useConversationUI();
  const pendingMessageRef = useRef<{ text: string; id: string; countryKey: string | null } | null>(null);
  const waitingForConversationRef = useRef<boolean>(false);

  // When a pending message exists and active conversation becomes available, send it.
  useEffect(() => {
    const tryFlush = async () => {
      if (!pendingMessageRef.current) return;
      const { text: msg, id: pendingId, countryKey } = pendingMessageRef.current;
      // Ensure we have an active conversation
      const targetConvId = conv.activeId;
      if (!targetConvId) return;
      const effectiveCountry = countryKey ?? selectedCountry ?? ui.selectedCountry ?? null;
      const userMessage: Message = {
        id: pendingId,
        type: 'user',
        content: msg,
        timestamp: Date.now(),
        country_key: effectiveCountry ?? undefined,
      };
      conv.addMessage(targetConvId, userMessage);
      // emit via socket if available
      try {
        if (socket && isConnected) {
          socket.emit('user_message', {
            conversationId: targetConvId,
            message: msg,
            selected_country_key: effectiveCountry ?? null,
            client_ts: Date.now(),
            message_id: pendingId
          });
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to emit user_message', err);
      } finally {
        pendingMessageRef.current = null;
        waitingForConversationRef.current = false;
      }
    };

    void tryFlush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv.activeId, socket, isConnected]);

  const handleSend = async (msg: string) => {
    // forward to any optional caller
    if (onSend) onSend(msg);

    // If we already have a conversationId (or activeId), send immediately.
    const targetConvId = conv.activeId ?? conversationId;
    const messageId = `local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const effectiveCountry = selectedCountry ?? ui.selectedCountry ?? null;
    if (targetConvId) {
      const optimisticMessage: Message = {
        id: messageId,
        type: 'user',
        content: msg,
        timestamp: Date.now(),
        country_key: effectiveCountry ?? undefined,
      };
      conv.addMessage(targetConvId, optimisticMessage);
      try {
        if (socket && isConnected) {
          socket.emit('user_message', {
            conversationId: targetConvId,
            message: msg,
            selected_country_key: effectiveCountry ?? null,
            client_ts: Date.now(),
            message_id: messageId
          });
        } else {
          // If socket not connected, still buffer and let WSContext handle reconnection
          pendingMessageRef.current = { text: msg, id: messageId, countryKey: effectiveCountry ?? null };
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to emit user_message', err);
        pendingMessageRef.current = { text: msg, id: messageId, countryKey: effectiveCountry ?? null };
      }
      return;
    }

    // No conversation exists yet -> create lazily, buffer the message, and wait for activeId.
    if (!conv.startNewConversation) {
      // Fallback: store locally and give feedback
      pendingMessageRef.current = { text: msg, id: messageId, countryKey: effectiveCountry ?? null };
      return;
    }

    // Prevent duplicate calls
    if (waitingForConversationRef.current) {
      pendingMessageRef.current = { text: msg, id: messageId, countryKey: effectiveCountry ?? null };
      return;
    }

    waitingForConversationRef.current = true;
    pendingMessageRef.current = { text: msg, id: messageId, countryKey: effectiveCountry ?? null };

    try {
      // Trigger creation (non-auto)
      await conv.startNewConversation({ auto: false });
      const placeholderId = conv.activeId;
      if (placeholderId) {
        const optimisticMessage: Message = {
          id: messageId,
          type: 'user',
          content: msg,
          timestamp: Date.now(),
          country_key: effectiveCountry ?? undefined,
        };
        conv.addMessage(placeholderId, optimisticMessage);
      }
      // Now wait for conv.activeId to be set by ConversationsContext event (conversation_created handler)
      // We rely on the useEffect above to flush the pendingMessage when activeId arrives.
      // Add a safety timeout: if activeId doesn't arrive within 5s, clear waiting flag but keep pending message.
      const timeout = setTimeout(() => {
        waitingForConversationRef.current = false;
      }, 5000);
      // cleanup timeout when activeId arrives
      const unwatch = () => {
        clearTimeout(timeout);
      };
      // Attempt to clear immediately if activeId present
      if (conv.activeId) {
        unwatch();
        waitingForConversationRef.current = false;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('startNewConversation failed', err);
      waitingForConversationRef.current = false;
    }
  };

  return (
    <div className="p-3">
      <ChatInput onSendMessage={handleSend} disabled={disabled || !isConnected} selectedCountry={selectedCountry ?? ui.selectedCountry ?? null} />
    </div>
  );
}