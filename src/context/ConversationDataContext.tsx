'use client';

import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { Message } from '@/types/chat';

type ConversationDataContextType = {
  list: {
    id: string;
    title?: string | null;
    updated_at: string | Date;
    message_count?: number;
    persona_id?: string | null;
  }[];
  messages: Record<string, Message[]>;
  fetchConversations: (force?: boolean) => Promise<void>;
  addMessage: (conversationId: string, message: Message) => void;
  setConversationMessages: (conversationId: string, messages: Message[]) => void;
  deleteConversation: (conversationId: string) => Promise<boolean>;
  deleteAllConversations: () => Promise<boolean>;
};

export const ConversationDataContext = createContext<ConversationDataContextType | undefined>(undefined);

export function ConversationDataProvider({ children }: { children: ReactNode }) {
  // This provider is populated by ConversationsRootProvider in normal runtime.
  // If mounted standalone, return a placeholder value (will be replaced).
  return <ConversationDataContext.Provider value={undefined as any}>{children}</ConversationDataContext.Provider>;
}

/**
 * Hook: useConversationData
 * Preferred hook for components that only need conversation data (no UI state).
 *
 * Returns safe no-op defaults when the provider is not mounted (prevents errors during
 * prerender or components used outside the provider). Consumers should expect empty
 * lists and no-op functions in that case.
 */
export function useConversationData(): ConversationDataContextType {
  const ctx = useContext(ConversationDataContext);
  if (!ctx) {
    // Return safe defaults (no-op implementations) to avoid circular fallbacks and runtime errors
    return {
      list: [],
      messages: {},
      fetchConversations: async () => { /* no-op */ },
      addMessage: () => { /* no-op */ },
      setConversationMessages: () => { /* no-op */ },
      deleteConversation: async () => false,
      deleteAllConversations: async () => false,
    };
  }
  return ctx;
}