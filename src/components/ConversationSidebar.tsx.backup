'use client';

import React, { useRef, useState } from 'react';
import { useConversations } from '@/context/ConversationsContext';
import { Plus, Search, User, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';

export default function ConversationSidebar() {
  const { list, activeId, setActive, loading, error, historyLoadingId, startNewConversation } = useConversations();
  const listRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations based on search query
  const filteredList = list.filter(conv =>
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.id.includes(searchQuery)
  );

  // Keyboard navigation between items
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = filteredList.findIndex(c => c.id === activeId);
    if (e.key === 'ArrowDown' && idx < filteredList.length - 1) {
      setActive(filteredList[idx + 1].id);
    } else if (e.key === 'ArrowUp' && idx > 0) {
      setActive(filteredList[idx - 1].id);
    } else if (e.key === 'Enter') {
      if (activeId) setActive(activeId);
    }
  };

  return (
    <aside className="h-full">
      <div className="h-full w-full md:w-60 lg:w-64 xl:w-72 p-0 bg-[#202123] border-r border-gray-700">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Section: New Chat Button */}
          <div className="p-4 border-b border-gray-700">
            <button
              onClick={() => startNewConversation()}
              className="w-full flex items-center gap-2 justify-center px-3 py-2 rounded-md bg-[#4b90ff] hover:bg-[#4b90ff]/90 text-white transition-colors"
              aria-label="Start new conversation"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>
          </div>

          {/* Search/Filter (Optional) */}
          <div className="p-4 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4b90ff] focus:border-transparent"
              />
            </div>
          </div>

          {/* Scrollable Conversation List */}
          <div
            role="listbox"
            aria-label="Conversations"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            ref={listRef}
            className="flex-1 overflow-y-auto"
          >
            <div className="px-4 py-3 border-b border-gray-700">
              <h2 className="text-sm font-semibold text-white/90">Your conversations</h2>
            </div>

            {loading && (
              <div className="p-4 text-white/80 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading conversations...
              </div>
            )}

            {error && !loading && (
              <div className="p-4 text-red-300 text-sm">Error: {error}</div>
            )}

            {!loading && !error && filteredList.length === 0 && (
              <div className="p-4 text-white/70 text-sm">No conversations yet.</div>
            )}

            {!loading && !error && filteredList.length > 0 && (
              <ul className="py-2">
                {filteredList.map((c) => {
                  const isActive = c.id === activeId;
                  const updatedIso = typeof c.updated_at === 'string'
                    ? c.updated_at
                    : c.updated_at?.toISOString?.() ?? new Date().toISOString();

                  return (
                    <li key={c.id} className="px-2">
                      <button
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        tabIndex={-1}
                        className={clsx(
                          'w-full text-left px-3 py-2 rounded-xl transition',
                          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400/60',
                          isActive
                            ? 'bg-white/20 ring-1 ring-white/30 text-white'
                            : 'hover:bg-white/10 text-white/90'
                        )}
                        onClick={() => setActive(c.id)}
                        aria-label={`${c.title ?? 'Untitled'} – updated ${new Date(updatedIso).toLocaleString()}`}
                      >
                        <div className="text-sm font-medium truncate">
                          {c.title ?? 'Untitled'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/70">
                          <time dateTime={updatedIso}>
                            {new Date(updatedIso).toLocaleString()}
                          </time>
                          {typeof c.message_count === 'number' && (
                            <span aria-hidden>• {c.message_count} msgs</span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* History-specific loading indicator for active conversation */}
            {historyLoadingId === activeId && !loading && (
              <div className="p-4 text-white/80 flex items-center gap-2 border-t border-gray-700">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading conversation history...
              </div>
            )}
          </div>

          {/* Footer: User Info + Upgrade */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/90">User</p>
                <p className="text-xs text-white/60">Free Plan</p>
              </div>
            </div>
            <Link
              href="/enterprise"
              className="w-full flex items-center gap-2 text-sm text-white/90 hover:text-white"
            >
              <span>Upgrade</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}