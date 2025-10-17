'use client';

import React from 'react';
import clsx from 'clsx';

export type ChatHeaderProps = {
  activeConversation: {
    id?: string;
    title?: string | null;
    updated_at?: string | Date;
  } | null;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
};

/**
 * ChatHeader - lightweight header for chat page
 * Extracted to its own file to support incremental decomposition.
 */
export default function ChatHeader({
  activeConversation,
  sidebarOpen,
  toggleSidebar,
}: ChatHeaderProps) {
  return (
    <header className={clsx('flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700')}>
      <div className="flex items-center gap-3">
        <button
          aria-label="Toggle sidebar"
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {/* simple hamburger icon - keep lightweight */}
          <span className="sr-only">Toggle sidebar</span>
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <rect y="0" width="18" height="2" rx="1" fill="currentColor" />
            <rect y="5" width="18" height="2" rx="1" fill="currentColor" />
            <rect y="10" width="18" height="2" rx="1" fill="currentColor" />
          </svg>
        </button>

        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {activeConversation?.title ?? 'Chat'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {activeConversation?.updated_at
              ? `Updated ${String(activeConversation.updated_at)}`
              : 'No conversations yet'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Placeholder for model selector / controls */}
        <div className="text-xs text-gray-500 dark:text-gray-400">Model</div>
      </div>
    </header>
  );
}