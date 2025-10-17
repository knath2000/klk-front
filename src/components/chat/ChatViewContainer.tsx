'use client';

import React, { useMemo } from 'react';
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
      </div>
    </div>
  );
}