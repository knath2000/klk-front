'use client';

import React, { useMemo, useEffect } from 'react';
// replaced monolithic context usage with adapters
import { useConversationData } from '@/context/ConversationDataContext';
import { useConversationUI } from '@/context/ConversationUIContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { useAuth } from '@/context/AuthContext';
import ChatHeader from './ChatHeader';
import ChatMessagesList from './ChatMessagesList';
import ChatInputSection from './ChatInputSection';
import clsx from 'clsx';

type Props = {
  onFooterChange?: React.Dispatch<React.SetStateAction<React.ReactNode | null>> | undefined;
};

export default function ChatViewContainer({ onFooterChange }: Props): React.ReactElement {
  const data = useConversationData();
  const ui = useConversationUI();
  const ws = useWebSocket();
  const { user } = useAuth();

  const activeConversation = useMemo(() => {
    return data.list.find((c) => c.id === ui.activeId) ?? null;
  }, [data.list, ui.activeId]);

  // Determine if the active conversation has any messages.
  // If there are no messages we consider this the "empty/hero" state and hide the footer input.
  const messagesForActive = (data.messages && ui.activeId) ? (data.messages[ui.activeId] ?? []) : [];
  const showFooter = messagesForActive.length > 0;

  // Memoize the footer node so its identity is stable across renders unless
  // one of its dependencies changes. This avoids creating a new JSX value on
  // every render (which previously caused render-phase updates / infinite loops).
  const footerNode = React.useMemo(() => {
    if (!showFooter) return null;
    return (
      <footer className="border-t border-gray-200 dark:border-gray-700">
        <ChatInputSection
          conversationId={ui.activeId}
          onSend={() => {
            /* placeholder */
          }}
          disabled={!ws.isConnected}
          selectedCountry={activeConversation?.persona_id ?? null}
        />
      </footer>
    );
  }, [showFooter, ui.activeId, ws.isConnected, activeConversation?.persona_id]);

  // Only call the parent's setter when the memoized node changes.
  React.useEffect(() => {
    if (!onFooterChange) return;
    onFooterChange(footerNode);
  }, [onFooterChange, footerNode]);

  return (
    <div className={clsx('flex w-full h-full items-stretch bg-transparent')}>
      <div className="flex-1 flex flex-col h-full">
        <ChatHeader
          activeConversation={activeConversation}
          sidebarOpen={ui.sidebarOpen}
          toggleSidebar={ui.toggleSidebar}
        />

        <main className="flex-1 overflow-y-auto p-4">
          <ChatMessagesList
            conversationId={ui.activeId}
            isConnected={ws.isConnected}
            isAuthenticated={!!user?.id}
          />
        </main>
      </div>
    </div>
  );
}