'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { ConversationsProvider } from '@/context/ConversationsContext';
import ConversationSidebar from '@/components/ConversationSidebar';
import ChatView from '@/components/ChatView';

export default function ChatShell() {
  const { user } = useAuth();

  if (user) {
    return (
      <ConversationsProvider>
        <div className="flex min-h-screen">
          {/* Sidebar - hidden on small screens, visible on lg+ */}
          <aside className="hidden lg:block w-80 bg-[#202123] sticky top-0 h-screen overflow-y-auto">
            <ConversationSidebar />
          </aside>
          {/* Main content */}
          <main className="flex-1 flex flex-col min-h-screen">
            <ChatView />
          </main>
        </div>
      </ConversationsProvider>
    );
  }

  // Unauthenticated users: full-width chat
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <ChatView />
    </div>
  );
}