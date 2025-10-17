'use client';

import React, { createContext, useContext, type ReactNode } from 'react';
import { ConversationsRootProvider } from './ConversationsRootProvider';
import { useConversationData } from './ConversationDataContext';
import { useConversationUI } from './ConversationUIContext';
import type { Message } from '@/types/chat';

/**
 * Compatibility wrapper for the original ConversationsContext API.
 * This file provides:
 * - ConversationsProvider: mounts the ConversationsRootProvider (which contains the logic)
 * - useConversations(): returns a combined shape composed from data & UI adapters
 *
 * Purpose: enable an incrementally safe migration (Option A) by keeping the old
 * hook/API available while the underlying implementation moves into the root provider.
 */

/* Re-declare the public shape consumers expect (keeps types stable) */
export type ConversationSummary = {
  id: string;
  title?: string | null;
  updated_at: string | Date;
  message_count?: number;
  persona_id?: string | null;
};

export type ConversationsContextType = {
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
  deleteConversation: (conversationId: string) => Promise<boolean>;
  deleteAllConversations: () => Promise<boolean>;
  unreadCounts: Record<string, number>;
  clearUnread: (conversationId: string) => void;
  messages: Record<string, Message[]>;
  addMessage: (conversationId: string, message: Message) => void;
  setConversationMessages: (conversationId: string, messages: Message[]) => void;
};

/**
 * ConversationsProvider
 * Mounts the ConversationsRootProvider which holds the authoritative logic,
 * but does not itself re-implement any business logic.
 */
export function ConversationsProvider({ children }: { children: ReactNode }) {
  return <ConversationsRootProvider>{children}</ConversationsRootProvider>;
}

/**
 * useConversations
 * Compatibility hook that composes the adapter hooks to return the legacy API shape.
 * Consumers may keep using this hook during migration.
 */
export function useConversations(): ConversationsContextType {
  const data = useConversationData();
  const ui = useConversationUI();

  // Compose a best-effort combined API
  return {
    list: data.list,
    messages: data.messages,
    activeId: ui.activeId,
    setActive: ui.setActive,
    refresh: data.fetchConversations,
    loading: (data as any).loading ?? false,
    error: (data as any).error ?? null,
    historyLoadingId: ui.historyLoadingId,
    notifyHistoryResolved: ui.notifyHistoryResolved,
    sidebarOpen: ui.sidebarOpen,
    toggleSidebar: ui.toggleSidebar,
    startNewConversation: ui.startNewConversation ?? (data as any).startNewConversation ?? (async () => {}),
    deleteConversation: data.deleteConversation,
    deleteAllConversations: data.deleteAllConversations,
    unreadCounts: ui.unreadCounts,
    clearUnread: ui.clearUnread,
    addMessage: data.addMessage,
    setConversationMessages: data.setConversationMessages,
  };
}

/**
 * Optional non-throwing accessor for compatibility with previous code.
 * Returns undefined if used outside of providers.
 */
export function useOptionalConversations(): ConversationsContextType | undefined {
  try {
    return useConversations();
  } catch {
    return undefined;
  }
}