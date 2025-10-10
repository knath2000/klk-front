"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import React from 'react';
import { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchContainerProps {
  onQuerySubmit: (query: string) => void;
  onQueryClear: () => void;
  isLoading: boolean;
}

export function SearchContainer({ onQuerySubmit, onQueryClear, isLoading }: SearchContainerProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[SearchContainer] handleSubmit called, query:', query);
    if (query.trim()) {
      try {
        onQuerySubmit(query.trim());
        // Small tick to confirm the call was made
        setTimeout(() => console.log('[SearchContainer] onQuerySubmit invoked for query:', query.trim()), 50);
      } catch (err) {
        console.error('[SearchContainer] onQuerySubmit threw error:', err);
      }
    } else {
      console.log('[SearchContainer] submit ignored - query empty');
    }
  };

  const handleClear = () => {
    setQuery('');
    onQueryClear();
  };

  const rightIcon = isLoading ? (
    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900/25" />
    </div>
  ) : query ? (
    <button
      type="button"
      onClick={handleClear}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
      aria-label="Clear search"
    >
      <X className="h-4 w-4" />
    </button>
  ) : null;

  return (
    <div className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for translations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-10 px-3 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent"
            role="searchbox"
            aria-label="Search input"
          />
          {rightIcon}
        </div>
      </form>
    </div>
  );
}