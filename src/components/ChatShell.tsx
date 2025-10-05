'use client';

import React, { useState, useEffect } from 'react';
import { ConversationsProvider } from '@/context/ConversationsContext';
import ConversationSidebarCollapsible from '@/components/ConversationSidebarCollapsible';
import ChatView from '@/components/ChatView';

export default function ChatShellFullHeight() {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsSidebarCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <ConversationsProvider>
      <div className="flex h-screen relative" style={{ height: '100dvh' }}>
        {/* Mobile hamburger menu button */}
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className={`lg:hidden fixed top-4 z-[60] p-2 bg-[#202123] rounded-md border border-gray-600 hover:bg-[#2a2b32] transition-colors ${
            isSidebarCollapsed ? 'left-4' : 'left-4'
          }`}
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

        {/* Sidebar - mobile drawer + desktop collapsible sidebar */}
        <aside
          className={`
            ${isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 lg:block
            fixed lg:sticky top-0
            ${isSidebarCollapsed ? 'w-16' : 'w-80'}
            bg-[#202123] z-[60] lg:z-auto
            transition-all duration-300 ease-in-out
            overflow-y-auto
          `}
          style={{
            height: '100dvh',
            minHeight: '100dvh'
          }}
        >
          <ConversationSidebarCollapsible
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
            onMobileClose={() => setIsMobileDrawerOpen(false)}
          />
        </aside>

        {/* Main content */}
        <main
          className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-0'
          }`}
          style={{
            height: '100dvh',
            minHeight: '100dvh'
          }}
        >
          <ChatView />
        </main>
      </div>
    </ConversationsProvider>
  );
}