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
        <div className="pt-16 min-h-screen">
          <div className="grid grid-cols-1 md:grid-cols-[260px,1fr]">
            {/* Sidebar hidden on small screens; visible >= md */}
            <div className="hidden md:block">
              <ConversationSidebar />
            </div>
            {/* Chat content */}
            <div className="col-span-1">
              <ChatView />
            </div>
          </div>
        </div>
      </ConversationsProvider>
    );
  }

  // Unauthenticated users: render chat full width with top padding
  return (
    <div className="pt-16 min-h-screen">
      <ChatView />
    </div>
  );
}