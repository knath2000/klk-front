'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { useConversationUI } from '@/context/ConversationUIContext';
import ConversationSidebarCollapsible from '@/components/ConversationSidebarCollapsible';
import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import clsx from 'clsx';

type TranslationLayoutProps = {
  children: ReactNode; // Translation search + results
};

export default function TranslationLayout({ children }: TranslationLayoutProps) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const { isSidebarCollapsed, setSidebarCollapsed, toggleSidebarCollapsed } = useConversationUI();

  return (
    <div className="relative flex min-h-screen items-stretch">
      {/* Mobile hamburger menu button for conversations sidebar */}
      <button
        onClick={() => setIsMobileDrawerOpen(true)}
        className={`lg:hidden fixed z-[60] p-2 bg-[#202123] rounded-md border border-gray-600 hover:bg-[#2a2b32] transition-colors left-4 mobile-safe-area min-touch`}
        style={{ top: 'calc(var(--safe-top) + 0.5rem)' }}
        aria-label="Open conversations menu"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay for conversations sidebar */}
      {isMobileDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-[55]"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      {/* Sidebar - Conversations (left) */}
      <aside
        className={clsx(
          'sidebar-shell drawer-width fixed left-0 drawer-inner drawer-top-offset bg-[#202123] z-[60] overflow-y-auto transition-transform duration-300 ease-in-out',
          isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:fixed lg:inset-y-0 lg:left-0 lg:translate-x-0 lg:block lg:flex-shrink-0',
          isSidebarCollapsed ? 'lg:[width:var(--sidebar-collapsed-width)]' : 'lg:[width:var(--sidebar-expanded-width)]'
        )}
        style={{ top: 'var(--safe-top)' }}
      >
        <ConversationSidebarCollapsible
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
          onMobileClose={() => setIsMobileDrawerOpen(false)}
        />
      </aside>

      {/* Desktop collapse/expand toggle for conversations sidebar */}
      <button
        onClick={toggleSidebarCollapsed}
        className="hidden lg:block absolute z-[70] p-1.5 bg-[#202123] border border-gray-600 rounded-full hover:bg-[#2a2b32] transition-colors"
        style={{
          top: 'calc(var(--safe-top) + 1.5rem)',
          left: isSidebarCollapsed ? 'calc(var(--sidebar-collapsed-width) + 1rem)' : 'calc(var(--sidebar-expanded-width) + 1rem)',
          transform: 'translateX(-50%)'
        }}
        aria-label={isSidebarCollapsed ? 'Expand conversations' : 'Collapse conversations'}
      >
        {isSidebarCollapsed ? <ChevronRight className="w-4 h-4 text-gray-300" /> : <ChevronLeft className="w-4 h-4 text-gray-300" />}
      </button>

      {/* Main content area - Translation */}
      <main
        className={clsx(
          'flex-1 relative flex flex-col transition-all duration-300 ease-in-out bg-[#0b0c1a] ml-0',
          isSidebarCollapsed ? 'lg:ml-[var(--sidebar-collapsed-width)]' : 'lg:ml-[var(--sidebar-expanded-width)]'
        )}
      >
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Translation content (left side) */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Chat support panel button - mobile floating */}
      <button
        onClick={() => setIsChatPanelOpen(!isChatPanelOpen)}
        className={clsx(
          'lg:hidden fixed z-50 p-3 rounded-full shadow-lg transition-all duration-300',
          isChatPanelOpen ? 'bottom-[420px] right-4' : 'bottom-4 right-4',
          'bg-blue-600 hover:bg-blue-700 text-white'
        )}
        aria-label="Toggle chat support panel"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Mobile overlay for chat panel */}
      {isChatPanelOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-[45]"
          onClick={() => setIsChatPanelOpen(false)}
        />
      )}

      {/* Chat support panel - mobile drawer + desktop sidebar */}
      <aside
        className={clsx(
          'fixed right-0 inset-y-0 bg-[#202123] z-[50] overflow-y-auto transition-transform duration-300 ease-in-out',
          'w-80 border-l border-gray-600',
          isChatPanelOpen ? 'translate-x-0' : 'translate-x-full',
          'lg:translate-x-0 lg:block lg:flex-shrink-0'
        )}
        style={{ top: 'var(--safe-top)' }}
      >
        {/* Chat panel content placeholder */}
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-600">
            <h2 className="text-lg font-semibold text-white flex items-center justify-between">
              <span>Chat Support</span>
              <button
                onClick={() => setIsChatPanelOpen(false)}
                className="lg:hidden p-1 hover:bg-gray-700 rounded"
                aria-label="Close chat panel"
              >
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            </h2>
          </div>
          <div className="flex-1 p-4 text-gray-400 text-sm">
            Chat support features coming soon
          </div>
        </div>
      </aside>

      {/* Desktop collapse/expand toggle for chat panel */}
      <button
        onClick={() => setIsChatPanelOpen(!isChatPanelOpen)}
        className="hidden lg:block absolute z-[70] p-1.5 bg-[#202123] border border-gray-600 rounded-full hover:bg-[#2a2b32] transition-colors"
        style={{
          top: 'calc(var(--safe-top) + 1.5rem)',
          right: 'calc(var(--sidebar-expanded-width) + 1rem)',
          transform: 'translateX(50%)'
        }}
        aria-label={isChatPanelOpen ? 'Collapse chat panel' : 'Expand chat panel'}
      >
        {isChatPanelOpen ? <ChevronRight className="w-4 h-4 text-gray-300" /> : <ChevronLeft className="w-4 h-4 text-gray-300" />}
      </button>
    </div>
  );
}
