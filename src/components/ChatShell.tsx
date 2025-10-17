'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { useConversationUI } from '@/context/ConversationUIContext';
import ConversationSidebarCollapsible from '@/components/ConversationSidebarCollapsible';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type ChatShellProps = {
  children: ReactNode;
  footerSlot?: ReactNode;
};

export default function ChatShellFullHeight({ children, footerSlot }: ChatShellProps) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const { isSidebarCollapsed, setSidebarCollapsed, toggleSidebarCollapsed } = useConversationUI();

  return (
    <div className="relative flex min-h-screen items-stretch">
      {/* Mobile hamburger menu button */}
      <button
        onClick={() => setIsMobileDrawerOpen(true)}
        className={`lg:hidden fixed z-[60] p-2 bg-[#202123] rounded-md border border-gray-600 hover:bg-[#2a2b32] transition-colors ${isSidebarCollapsed ? 'left-4' : 'left-4'} mobile-safe-area min-touch`}
        style={{ top: 'calc(var(--safe-top) + 0.5rem)' }}
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
          fixed left-0 drawer-width drawer-inner drawer-top-offset
          lg:fixed lg:inset-y-0 lg:left-0 lg:translate-x-0 lg:block
          lg:flex-shrink-0
          ${isSidebarCollapsed ? 'w-72 lg:w-16 xl:w-16' : 'w-72 md:w-60 lg:w-64 xl:w-72'}
          bg-[#202123]            /* opaque background to occlude page gradient */
          z-[60]
          transition-transform duration-300 ease-in-out
          overflow-y-auto
        `}
        style={{ top: 'var(--safe-top)' }}
      >
        <ConversationSidebarCollapsible
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
          onMobileClose={() => setIsMobileDrawerOpen(false)}
        />
      </aside>

      {/* Desktop collapse/expand toggle positioned relative to layout container so it tracks the outer aside width */}
      <button
        onClick={toggleSidebarCollapsed}
        className="hidden lg:block absolute z-[70] p-1.5 bg-[#202123] border border-gray-600 rounded-full hover:bg-[#2a2b32] transition-colors"
        style={{
          top: 'calc(var(--safe-top) + 1.5rem)',
          left: isSidebarCollapsed ? '4rem' : '20rem',
          transform: 'translateX(-50%)'
        }}
        aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isSidebarCollapsed ? <ChevronRight className="w-4 h-4 text-gray-300" /> : <ChevronLeft className="w-4 h-4 text-gray-300" />}
      </button>

      {/* Main content */}
      <main
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:ml-16' : 'md:ml-60 lg:ml-64 xl:ml-72'
        }`}
      >
        <div className="flex-1 flex flex-col">{children}</div>
        {footerSlot}
      </main>
    </div>
  );
}