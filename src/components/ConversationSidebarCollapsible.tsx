'use client';

import React, { useRef, useState, useMemo } from 'react';
import { useConversations } from '@/context/ConversationsContext';
import { useAuth } from '@/context/AuthContext';
import { Plus, Search, User, ChevronRight, LogOut, Zap, ChevronLeft, MessageSquare, Languages, Trash } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import ModelSelector from '@/components/ModelSelector';
import { usePathname } from 'next/navigation';
import { Virtuoso } from 'react-virtuoso';

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
  const { list, activeId, setActive, loading, error, historyLoadingId, startNewConversation, deleteConversation } = useConversations();
  const { user, signOut } = useAuth();
  const listRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentModel, setCurrentModel] = useState('google/gemma-3-27b-it');
  const pathname = usePathname();

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

  const handleModelChange = (modelId: string) => {
    setCurrentModel(modelId);
    // TODO: Implement model change logic
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
      <div className={`h-full bg-[#202123] border-r border-gray-700 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-full md:w-60 lg:w-64 xl:w-72'
      }`}>
        {/* Collapse Toggle Button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="absolute -right-3 top-6 z-10 p-1.5 bg-[#202123] border border-gray-600 rounded-full hover:bg-[#2a2b32] transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-300" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-300" />
            )}
          </button>
        )}

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
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-4`}>
            {/* Logo/Brand */}
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'}`}>
              <div className="w-6 h-6 rounded bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">AC</span>
              </div>
              {!isCollapsed && (
                <span className="text-lg font-bold text-gray-200">AI Chat Español</span>
              )}
            </div>

            {/* User Account Menu */}
            {user && !isCollapsed ? (
              <div className="relative">
                <button
                  className="flex items-center space-x-2 px-2 py-1.5 rounded bg-gray-200/10 hover:bg-gray-200/20 text-gray-200 hover:text-white transition-all duration-200"
                  onClick={() => {/* TODO: Implement user menu */}}
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                    <User className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="text-sm font-medium hidden md:block">
                    {user.name || user.email}
                  </span>
                </button>
              </div>
            ) : user && isCollapsed ? (
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                <User className="w-2.5 h-2.5 text-white" />
              </div>
            ) : !isCollapsed ? (
              <Link
                href="/auth/signin"
                className="px-3 py-1.5 text-sm font-medium text-gray-200 hover:text-white hover:bg-gray-200/10 rounded transition-all duration-200"
              >
                Sign In
              </Link>
            ) : null}
          </div>

          {/* Primary Navigation */}
          <nav className={`flex ${isCollapsed ? 'flex-col gap-2 items-center' : 'items-center gap-2'} mb-4`}>
            <Link
              href="/"
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
                pathname === '/' ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10',
                isCollapsed ? 'w-10 justify-center' : 'w-full justify-start'
              )}
              aria-label="Chat workspace"
            >
              <MessageSquare className="w-4 h-4" />
              {!isCollapsed && <span className="text-sm font-medium">Chat</span>}
            </Link>
            <Link
              href="/translate"
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
                pathname?.startsWith('/translate') ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10',
                isCollapsed ? 'w-10 justify-center' : 'w-full justify-start'
              )}
              aria-label="Translation workspace"
            >
              <Languages className="w-4 h-4" />
              {!isCollapsed && <span className="text-sm font-medium">Translate</span>}
            </Link>
          </nav>

          {/* Model Selector - Hidden when collapsed */}
          {!isCollapsed && (
            <div className="mb-4">
              <ModelSelector
                currentModel={currentModel}
                onModelChange={handleModelChange}
              />
            </div>
          )}

          {/* Collapsed Model Selector Icon */}
          {isCollapsed && (
            <div className="flex justify-center mb-4">
              <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-gray-300" />
              </div>
            </div>
          )}

          {/* New Chat Button */}
          <button
            onClick={() => startNewConversation()}
            className={`flex items-center gap-2 px-3 py-2 rounded-md bg-[#4b90ff] hover:bg-[#4b90ff]/90 text-white transition-colors ${
              isCollapsed ? 'justify-center w-10 mx-auto' : 'w-full justify-center'
            }`}
            aria-label="Start new conversation"
          >
            <Plus className="w-4 h-4" />
            {!isCollapsed && <span>New Chat</span>}
          </button>
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
              <h2 className="text-sm font-semibold text-white/90">Your conversations</h2>
            )}
          </div>

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

                      {/* Delete button outside the main button to avoid nested buttons */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const confirmed = window.confirm('Delete this conversation? This is permanent.');
                          if (!confirmed) return;
                          try {
                            const ok = await deleteConversation?.(c.id);
                            if (!ok) {
                              alert('Failed to delete conversation');
                            }
                          } catch (err) {
                            console.error('Error deleting conversation via context helper:', err);
                            alert('Error deleting conversation');
                          }
                        }}
                        title="Delete conversation"
                        className="ml-1 p-2 rounded-md text-red-400 hover:text-red-200 hover:bg-white/5 transition"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
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

          {!!historyLoadingId && !!activeId && historyLoadingId === activeId && !loading && (
            <div className={`text-white/80 flex items-center gap-2 border-t border-gray-700 ${
              isCollapsed ? 'p-2 justify-center' : 'p-4'
            }`}>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {!isCollapsed && <span>Loading conversation history...</span>}
            </div>
          )}
        </div>

        {/* Footer: User Info + Upgrade */}
        <div className={`p-4 border-t border-gray-700 ${isCollapsed ? 'px-2' : ''}`}>
          {user ? (
            <>
              <div className={`flex items-center gap-3 mb-3 ${isCollapsed ? 'justify-center' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                {!isCollapsed && (
                  <div>
                    <p className="text-sm font-medium text-white/90">{user.name || 'User'}</p>
                    <p className="text-xs text-white/60">Free Plan</p>
                  </div>
                )}
              </div>
              <div className={`space-y-2 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
                <Link
                  href="/enterprise"
                  className={`flex items-center gap-2 text-sm text-white/90 hover:text-white bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded px-3 py-2 hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-200 ${
                    isCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  {!isCollapsed && <span>Get Plus</span>}
                </Link>
                <button
                  onClick={handleSignOut}
                  className={`flex items-center gap-2 text-sm text-white/90 hover:text-white hover:bg-white/10 rounded px-3 py-2 transition-all duration-200 ${
                    isCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  {!isCollapsed && <span>Sign Out</span>}
                </button>
              </div>
            </>
          ) : (
            <Link
              href="/enterprise"
              className={`flex items-center gap-2 text-sm text-white/90 hover:text-white bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded px-3 py-2 hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-200 ${
                isCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full'
              }`}
            >
              <Zap className="w-4 h-4" />
              {!isCollapsed && <span>Get Plus</span>}
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}