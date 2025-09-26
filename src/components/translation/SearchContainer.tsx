"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import React from 'react';
import { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { GlassInput } from '@/components/ui';
import { useTranslation } from '@/context/TranslationContext';

interface SearchContainerProps {
  onQuerySubmit: (query: string) => void;
  onQueryClear: () => void;
  isLoading: boolean;
}

export function SearchContainer({ onQuerySubmit, onQueryClear, isLoading }: SearchContainerProps) {
  const { state, dispatch } = useTranslation();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onQuerySubmit(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    onQueryClear();
  };

  return (
    <div className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} className="relative">
        <GlassInput
          ref={inputRef}
          type="text"
          placeholder="Search for translations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pr-10 pl-10"
          role="searchbox"
          aria-label="Search input"
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900/25" />
            </div>
          )}
          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </GlassInput>
      </form>
    </div>
  );
}