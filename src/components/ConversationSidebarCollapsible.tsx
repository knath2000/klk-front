'use client';

import React, { useRef, useState, useMemo, useCallback } from 'react';
import clsx from 'clsx';
import { useConversationData } from '@/context/ConversationDataContext';
import { useConversationUI } from '@/context/ConversationUIContext';
import { useAuth } from '@/context/AuthContext';
import { Plus, Search, User, ChevronRight, LogOut, Zap, ChevronLeft, MessageSquare, Languages, Trash, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import ConfirmationModal from '@/components/ConfirmationModal';
import { usePathname } from 'next/navigation';
import { Virtuoso } from 'react-virtuoso';
import { showToast } from '@/components/Toast';
import SidebarQuickActions from '@/components/SidebarQuickActions';
import SidebarFooter from '@/components/SidebarFooter';
import SidebarConversationMenu from '@/components/SidebarConversationMenu';
import RenameConversationModal from '@/components/RenameConversationModal';
// ModelSelector intentionally omitted from sidebar — model/persona controls belong in the chat header.

interface AIModel {
  id: string;
  name: string;
  display_name: string;
  description: string;
  inference_speed: 'fast' | 'medium' | 'slow';
  is_available: boolean;
}

interface ConversationSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onMobileClose?: () => void;
}

export default function ConversationSidebarCollapsible({
  isCollapsed = false,
  onToggleCollapse,
  onMobileClose
}: ConversationSidebarProps) {
  const data = useConversationData();
  const ui = useConversationUI();
  const { list, deleteConversation, deleteAllConversations, renameConversation } = data;
  const { activeId, setActive, loading, error, historyLoadingId, startNewConversation } = { // map backwards for compatibility
    ...ui,
    loading: (data as any).loading ?? false,
    error: (data as any).error ?? null,
    historyLoadingId: (data as any).historyLoadingId ?? null,
    startNewConversation: (data as any).startNewConversation ?? (ui as any).startNewConversation,
  };
  const { user, signOut } = useAuth();
  const listRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // model selector state removed from sidebar
  const pathname = usePathname();
  const [openDeleteAllModal, setOpenDeleteAllModal] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  // UI state for contextual menu and rename modal
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [renameOpenFor, setRenameOpenFor] = useState<string | null>(null);
  const [renameInitialTitle, setRenameInitialTitle] = useState<string>('');

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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <aside className="h-full relative">
      <div
        className={`h-full bg-[#202123] border-r border-gray-700 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-16 md:w-16 lg:w-16 xl:w-16' : 'w-full md:w-60 lg:w-64 xl:w-72'}`}
        style={{ willChange: 'width' }}
      >
        {/* Desktop collapse/expand toggle will be rendered by ChatShell as a sibling overlay */}
        {/* Mobile Close Button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden absolute top-4 right-4 p-1 text-gray-400 hover:text-white"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Header Section - Logo and User Account */}
        <div className={`p-4 border-b border-gray-700 ${isCollapsed ? 'px-2' : ''}`}>
          <SidebarQuickActions
            isCollapsed={isCollapsed}
            onNewChat={async () => {
              try {
                await startNewConversation?.({ auto: false });
                showToast('New conversation started', 'success');
              } catch (err) {
                console.error('Failed to start new conversation', err);
                showToast('Failed to start conversation', 'error');
              }
            }}
            onToggleSearch={() => ui.setSearchOpen?.(!ui.searchOpen)}
            user={user}
          />
        </div>

        {/* Search/Filter - Hidden when collapsed */}
        {!isCollapsed && (
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
        )}

        {/* Collapsed Search Icon */}
        {isCollapsed && (
          <div className="p-4 border-b border-gray-700 flex justify-center">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
        )}

        {/* Scrollable Conversation List */}
        <div
          role="listbox"
          aria-label="Conversations"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          ref={listRef}
          className="flex-1 overflow-y-auto"
        >
          <div className={`px-4 py-3 border-b border-gray-700 ${isCollapsed ? 'px-2' : ''}`}>
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white/90">Chats</h2>
              </div>
            )}
          </div>

          <ConfirmationModal
            open={openDeleteAllModal}
            title="Delete all conversations"
            description="This will permanently remove ALL your conversations and associated data. This action cannot be undone. Type DELETE to confirm."
            loading={deleteAllLoading}
            onCancel={() => setOpenDeleteAllModal(false)}
            onConfirm={async () => {
              try {
                setDeleteAllLoading(true);
                const ok = await deleteAllConversations?.();
                if (!ok) {
                  showToast('Failed to delete all conversations. Please try again later.', 'error');
                  return;
                }
                setOpenDeleteAllModal(false);
                showToast('All conversations deleted', 'success');
              } catch (err) {
                console.error('Error during bulk delete:', err);
                showToast('Error deleting conversations. See console for details.', 'error');
              } finally {
                setDeleteAllLoading(false);
              }
            }}
          />

          {loading && (
            <div className={`text-white/80 flex items-center gap-2 ${isCollapsed ? 'p-2 justify-center' : 'p-4'}`}>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {!isCollapsed && <span>Loading conversations...</span>}
            </div>
          )}

          {error && !loading && (
            <div className={`text-red-300 text-sm ${isCollapsed ? 'p-2 text-center' : 'p-4'}`}>
              {isCollapsed ? '!' : `Error: ${error}`}
            </div>
          )}

          {!loading && !error && filteredList.length === 0 && (
            <div className={`text-white/70 text-sm ${isCollapsed ? 'p-2 text-center' : 'p-4'}`}>
              {isCollapsed ? '...' : 'No conversations yet.'}
            </div>
          )}

          {!loading && !error && filteredList.length > 0 && (
            <div className="h-[calc(100vh-260px)]">
              <Virtuoso
                data={filteredList}
                itemContent={(index: number, c: any) => {
                  const isActive = c.id === activeId;
                  const updatedIso = typeof c.updated_at === 'string'
                    ? c.updated_at
                    : c.updated_at?.toISOString?.() ?? new Date().toISOString();

                  return (
                    <li key={c.id} className="flex items-center justify-between">
                      <button
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        tabIndex={-1}
                        className={clsx(
                          'flex-1 text-left py-2 px-3 rounded hover:bg-gray-800 transition-colors mr-2',
                          isActive ? 'bg-gray-800' : ''
                        )}
                        onClick={() => setActive(c.id)}
                        aria-label={`${c.title ?? 'Untitled'} – updated ${new Date(updatedIso).toLocaleString()}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="truncate">
                            <div className="font-medium text-white truncate">{c.title || 'Untitled'}</div>
                            <div className="text-xs text-white/60 truncate">{c.preview || ''}</div>
                          </div>
                          <div className="text-xs text-white/50 ml-2 whitespace-nowrap">
                            {new Date(updatedIso).toLocaleTimeString()}
                          </div>
                        </div>
                      </button>

                      {/* Ellipsis / contextual menu trigger */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenFor(prev => prev === c.id ? null : c.id);
                          }}
                          title="More actions"
                          aria-haspopup="true"
                          aria-expanded={menuOpenFor === c.id}
                          className="ml-1 p-2 rounded-md text-white/60 hover:text-white hover:bg-white/5 transition"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>

                        {menuOpenFor === c.id && (
                          <SidebarConversationMenu
                            conversationId={c.id}
                            onClose={() => setMenuOpenFor(null)}
                            onRename={(id) => {
                              setMenuOpenFor(null);
                              setRenameInitialTitle(c.title ?? '');
                              setRenameOpenFor(id);
                            }}
                            onDelete={async (id) => {
                              // Confirm then call provider deleteConversation
                              const ok = window.confirm('Delete this conversation? This is permanent.');
                              if (!ok) return;
                              try {
                                const res = await deleteConversation?.(id);
                                if (!res) {
                                  showToast('Failed to delete conversation', 'error');
                                } else {
                                  showToast('Conversation deleted', 'success');
                                }
                              } catch (err) {
                                console.error('Error deleting conversation:', err);
                                showToast('Error deleting conversation', 'error');
                              }
                            }}
                          />
                        )}
                      </div>
                    </li>
                  );
                }}
                overscan={6}
                components={{
                  // Loosely-typed List override: preserve semantic <ul> while avoiding strict cross-element ref typing issues.
                  List: (props: any) => {
                    const { style, children, ...rest } = props
                    return (
                      <ul style={style} role="listbox" aria-label="Conversations" {...(rest || {})}>
                        {children}
                      </ul>
                    )
                  }
                }}
              />
            </div>
          )}

          {/* Rename modal rendered outside the virtuoso rows scope */}
          <RenameConversationModal
            open={!!renameOpenFor}
            conversationId={renameOpenFor}
            initialTitle={renameInitialTitle}
            onCancel={() => setRenameOpenFor(null)}
            onConfirm={async (id, title) => {
              try {
                const ok = await renameConversation?.(id, title);
                if (ok) showToast('Conversation renamed', 'success');
                return !!ok;
              } catch (err) {
                console.error('Rename failed', err);
                showToast('Rename failed', 'error');
                return false;
              }
            }}
          />

           {!!historyLoadingId && !!activeId && historyLoadingId === activeId && !loading && (
            <div className={`text-white/80 flex items-center gap-2 border-t border-gray-700 ${
              isCollapsed ? 'p-2 justify-center' : 'p-4'
            }`}>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {!isCollapsed && <span>Loading conversation history...</span>}
            </div>
          )}
        </div>

        {/* Footer: composed SidebarFooter */}
        <SidebarFooter isCollapsed={isCollapsed} />
      </div>

      {/* Sidebar no longer renders a modal for model selection */}
    </aside>
  );
}