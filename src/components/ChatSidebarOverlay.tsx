"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useConversationData } from '@/context/ConversationDataContext';
import { useConversationUI } from '@/context/ConversationUIContext';
import ModelSelector from '@/components/ModelSelector';

export default function ChatSidebarOverlay() {
  const data = useConversationData();
  const ui = useConversationUI();
  const conversations = data.list;
  const activeId = ui.activeId;
  const setActive = ui.setActive;
  const refresh = data.fetchConversations;
  const unreadCounts = ui.unreadCounts;
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [focusedIdx, setFocusedIdx] = useState<number>(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    // refresh when opened (data adapter)
    void refresh();
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return;
    const first = panelRef.current?.querySelector<HTMLElement>('button, a, [tabindex="0"]');
    first?.focus();
  }, [open]);

  // Click-away closes overlay
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!open) return;
      if (!panelRef.current) return;
      if (panelRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const selectConversation = useCallback((id: string) => {
    setActive(id);
    setOpen(false);
  }, [setActive]);

  // Keyboard navigation for virtual list
  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIdx(i => Math.min(i + 1, conversations.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const conv = conversations[focusedIdx];
      if (conv) selectConversation(conv.id);
    }
  };

  return (
    <>
      {/* Trigger */}
      <button
        aria-label="Open sidebar"
        title="Open sidebar"
        onClick={() => setOpen(o => !o)}
        className="fixed z-50 left-4 top-4 w-10 h-10 rounded-md bg-white/8 backdrop-blur hover:bg-white/12 text-white flex items-center justify-center"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M3 5a2 2 0 0 1 2-2h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 6v13a2 2 0 0 1-2 2H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 6v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(4px)' }}>
          <aside
            ref={panelRef}
            role="complementary"
            aria-label="Chat sidebar"
            className="absolute left-6 top-6 bottom-6 w-[320px] max-w-[90vw] bg-[#0b0b0c] text-white rounded-lg shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
              <div className="flex items-center gap-3">
                <div className="text-lg font-semibold">Chats</div>
                <button aria-label="Refresh conversations" onClick={() => void refresh()} className="text-sm text-white/80 hover:text-white">Refresh</button>
              </div>
              <div>
                <button aria-label="Close sidebar" onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/6">✕</button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-2" onKeyDown={handleListKeyDown} tabIndex={0}>
              <div className="mb-3">
                <div className="px-2 text-xs text-white/70 uppercase tracking-wider mb-1">Recent</div>
                <div className="flex flex-col gap-1">
                  <Virtuoso
                    data={conversations}
                    itemContent={(index, conv) => (
                      <div key={conv.id} className={`flex items-center justify-between px-2 py-2 rounded hover:bg-white/6 ${conv.id === activeId ? 'bg-white/8' : ''}`}>
                        <button className="flex-1 text-left truncate" onClick={() => selectConversation(conv.id)}>
                          {conv.title || 'Untitled'}
                        </button>
                        <div className="flex items-center gap-2">
                          {unreadCounts && unreadCounts[conv.id] ? (
                            <span className="text-xs bg-rose-600 text-white rounded-full px-2 py-0.5">{unreadCounts[conv.id]}</span>
                          ) : null}
                        </div>
                      </div>
                    )}
                    style={{ padding: 0, height: '100%' }}
                  />
                </div>
              </div>

              <div className="mb-3">
                <div className="px-2 text-xs text-white/70 uppercase tracking-wider mb-1">GPTs</div>
                <div className="px-2">
                  <ModelSelector currentModel="google/gemma-3-27b-it" onModelChange={() => {}} />
                </div>
              </div>
            </div>

            <div className="border-t border-white/6 px-3 py-2 flex items-center justify-between">
              <div className="text-sm text-white/80">Account</div>
              <div className="flex items-center gap-2">
                <button aria-label="Settings" onClick={() => {}} className="px-2 py-1 rounded hover:bg-white/6">⚙️</button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}