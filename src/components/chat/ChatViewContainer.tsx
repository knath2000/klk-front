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

  // We render a single unified footer here (ChatInputSection). EmptyChatState
  // will be converted to presentation-only; the input lives here to avoid duplicate inputs.
  const footerNode = (
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
        
        {/* Unified footer always rendered here; presentation-only EmptyChatState will no longer mount its own ChatInputSection */}
        {footerNode}
      </div>
    </div>
  );
}