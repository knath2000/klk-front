'use client';

import React, { useRef, useState } from 'react';
import { useConversations } from '@/context/ConversationsContext';
import { useAuth } from '@/context/AuthContext';
import { Plus, Search, User, ChevronRight, LogOut, Zap } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import ModelSelector from '@/components/ModelSelector';

interface AIModel {
  id: string;
  name: string;
  display_name: string;
  description: string;
  inference_speed: 'fast' | 'medium' | 'slow';
  is_available: boolean;
}

export default function ConversationSidebarEnhanced() {
  const { list, activeId, setActive, loading, error, historyLoadingId, startNewConversation } = useConversations();
  const { user, signOut } = useAuth();
  const listRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentModel, setCurrentModel] = useState('meta-llama/llama-3.2-3b-instruct');

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
    <aside className="h-full">
      <div className="h-full w-full md:w-60 lg:w-64 xl:w-72 bg-[#202123] border-r border-gray-700 flex flex-col">
        {/* Header Section - Logo and User Account */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">AC</span>
              </div>
              <span className="text-lg font-bold text-gray-200">AI Chat Español</span>
            </div>

            {/* User Account Menu */}
            {user ? (
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
            ) : (
              <Link
                href="/auth/signin"
                className="px-3 py-1.5 text-sm font-medium text-gray-200 hover:text-white hover:bg-gray-200/10 rounded transition-all duration-200"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Model Selector */}
          <div className="mb-4">
            <ModelSelector
              currentModel={currentModel}
              onModelChange={handleModelChange}
            />
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => startNewConversation()}
            className="w-full flex items-center gap-2 justify-center px-3 py-2 rounded-md bg-[#4b90ff] hover:bg-[#4b90ff]/90 text-white transition-colors"
            aria-label="Start new conversation"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search/Filter */}
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
          {!!historyLoadingId && !!activeId && historyLoadingId === activeId && !loading && (
            <div className="p-4 text-white/80 flex items-center gap-2 border-t border-gray-700">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Loading conversation history...
            </div>
          )}
        </div>

        {/* Footer: User Info + Upgrade */}
        <div className="p-4 border-t border-gray-700">
          {user ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">{user.name || 'User'}</p>
                  <p className="text-xs text-white/60">Free Plan</p>
                </div>
              </div>
              <div className="space-y-2">
                <Link
                  href="/enterprise"
                  className="w-full flex items-center gap-2 text-sm text-white/90 hover:text-white bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded px-3 py-2 hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-200"
                >
                  <Zap className="w-4 h-4" />
                  <span>Get Plus</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 text-sm text-white/90 hover:text-white hover:bg-white/10 rounded px-3 py-2 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            <Link
              href="/enterprise"
              className="w-full flex items-center gap-2 text-sm text-white/90 hover:text-white bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded px-3 py-2 hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-200"
            >
              <Zap className="w-4 h-4" />
              <span>Get Plus</span>
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}