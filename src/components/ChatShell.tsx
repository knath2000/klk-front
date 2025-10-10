'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { ConversationsProvider } from '@/context/ConversationsContext';
import ConversationSidebarCollapsible from '@/components/ConversationSidebarCollapsible';

type ChatShellProps = {
  children: ReactNode;
  footerSlot?: ReactNode;
};

export default function ChatShellFullHeight({ children, footerSlot }: ChatShellProps) {
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
      <div className="relative flex min-h-screen items-stretch">
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
            sidebar-shell
            ${isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
            fixed inset-y-0 left-0 w-72
            lg:fixed lg:inset-y-0 lg:left-0 lg:translate-x-0 lg:block
            lg:flex-shrink-0
            ${isSidebarCollapsed ? 'lg:w-16' : 'lg:w-80'}
            z-[60]
            transition-transform duration-300 ease-in-out
            overflow-y-auto
          `}
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
            isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80'
          }`}
        >
          <div className="flex-1 flex flex-col">{children}</div>
          {footerSlot}
        </main>
      </div>
    </ConversationsProvider>
  );
}