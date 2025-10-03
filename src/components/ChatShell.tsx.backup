'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ConversationsProvider } from '@/context/ConversationsContext';
import ConversationSidebar from '@/components/ConversationSidebar';
import ChatView from '@/components/ChatView';

export default function ChatShellNew() {
  const { user } = useAuth();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  if (user) {
    return (
      <ConversationsProvider>
        <div className="flex min-h-screen relative">
          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-[#202123] rounded-md border border-gray-600 hover:bg-[#2a2b32] transition-colors"
            aria-label="Open conversations menu"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Mobile overlay */}
          {isMobileDrawerOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-[55]"
              onClick={() => setIsMobileDrawerOpen(false)}
            />
          )}

          {/* Sidebar - mobile drawer + desktop sidebar */}
          <aside className={`
            ${isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 lg:block
            fixed lg:sticky top-0 h-screen
            w-80 bg-[#202123] z-[60] lg:z-auto
            transition-transform duration-300 ease-in-out
            overflow-y-auto
          `}>
            <div className="p-4">
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="lg:hidden float-right p-1 text-gray-400 hover:text-white"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <ConversationSidebar />
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 flex flex-col min-h-screen lg:ml-0">
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