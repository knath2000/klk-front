'use client';

import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

type ConversationUIContextType = {
  activeId: string | null;
  setActive: (id: string) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebarCollapsed: () => void;
  unreadCounts: Record<string, number>;
  clearUnread: (conversationId: string) => void;
  historyLoadingId: string | null;
  notifyHistoryResolved: (conversationId: string) => void;
  // Allow creating conversations from UI layer
  startNewConversation?: (opts?: { auto?: boolean }) => Promise<void>;
};

export const ConversationUIContext = createContext<ConversationUIContextType | undefined>(undefined);

/**
 * ConversationUIProvider
 * Lightweight adapter/provider that exposes UI-only aspects of the conversations context.
 * For now it delegates to the existing ConversationsRootProvider which supplies values.
 */
export function ConversationUIProvider({ children }: { children: ReactNode }) {
  // The authoritative provider (ConversationsRootProvider) will supply this context at runtime.
  // When mounted standalone, the provider value will be set by the root provider; otherwise
  // components should use the hook and receive safe defaults.
  return <ConversationUIContext.Provider value={undefined as any}>{children}</ConversationUIContext.Provider>;
}

/**
 * Hook: useConversationUI
 * Prefer this hook in components that only need UI behavior (sidebar, active selection, unread counts).
 *
 * Returns safe defaults when the provider is not mounted to avoid runtime errors during prerender.
 */
export function useConversationUI(): ConversationUIContextType {
  const ctx = useContext(ConversationUIContext);
  if (!ctx) {
    // Safe defaults
    return {
      activeId: null,
      setActive: () => {},
      sidebarOpen: false,
      toggleSidebar: () => {},
      isSidebarCollapsed: false,
      setSidebarCollapsed: () => {},
      toggleSidebarCollapsed: () => {},
      unreadCounts: {},
      clearUnread: () => {},
      historyLoadingId: null,
      notifyHistoryResolved: () => {},
      startNewConversation: async () => {},
    };
  }
  return ctx;
}