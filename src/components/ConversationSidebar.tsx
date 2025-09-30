'use client';

import React, { useRef } from 'react';
import { useConversations } from '@/context/ConversationsContext';
import { GlassCard } from '@/components/ui';
import clsx from 'clsx';

export default function ConversationSidebar() {
  const { list, activeId, setActive, loading, error } = useConversations();
  const listRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation between items
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = list.findIndex(c => c.id === activeId);
    if (e.key === 'ArrowDown' && idx < list.length - 1) {
      setActive(list[idx + 1].id);
    } else if (e.key === 'ArrowUp' && idx > 0) {
      setActive(list[idx - 1].id);
    } else if (e.key === 'Enter') {
      if (activeId) setActive(activeId);
    }
  };

  return (
    <aside className="h-full">
      <GlassCard
        variant="light"
        size="md"
        gradient
        className="h-full w-full md:w-60 lg:w-64 xl:w-72 p-0"
      >
        <div
          role="listbox"
          aria-label="Conversations"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          ref={listRef}
          className="flex flex-col h-full overflow-y-auto"
        >
          <div className="px-4 py-3 border-b border-white/15">
            <h2 className="text-sm font-semibold text-white/90">Your conversations</h2>
          </div>

          {loading && (
            <div className="p-4 text-white/80 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Loading...
            </div>
          )}

          {error && !loading && (
            <div className="p-4 text-red-300 text-sm">Error: {error}</div>
          )}

          {!loading && !error && list.length === 0 && (
            <div className="p-4 text-white/70 text-sm">No conversations yet.</div>
          )}

          {!loading && !error && list.length > 0 && (
            <ul className="py-2">
              {list.map((c) => {
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
        </div>
      </GlassCard>
    </aside>
  );
}