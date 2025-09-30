'use client';

import { useState, useEffect, useRef } from 'react';

interface SearchResult {
  id: string;
  title: string;
  message_count: number;
  updated_at: string;
}

interface SearchSuggestion {
  id: string;
  title: string;
}

interface SearchBarProps {
  onConversationSelect: (conversationId: string) => void;
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onConversationSelect, onSearch }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Mock search results - in real app, this would come from API
  useEffect(() => {
    const mockResults: SearchResult[] = [
      {
        id: '1',
        title: 'Spanish Practice Session',
        message_count: 15,
        updated_at: '2025-09-04T10:30:00Z'
      },
      {
        id: '2',
        title: 'Mexican Slang Discussion',
        message_count: 8,
        updated_at: '2025-09-03T15:45:00Z'
      },
      {
        id: '3',
        title: 'Argentina Cultural Exchange',
        message_count: 22,
        updated_at: '2025-09-02T09:15:00Z'
      }
    ];
    setResults(mockResults);

    const mockSuggestions: SearchSuggestion[] = [
      { id: 's1', title: 'Spanish grammar' },
      { id: 's2', title: 'Mexican food' },
      { id: 's3', title: 'Argentine culture' },
      { id: 's4', title: 'Travel tips' }
    ];
    setSuggestions(mockSuggestions);
  }, []);

  // Handle click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.length > 0) {
      setIsOpen(true);
      setIsLoading(true);
      
      // Call the onSearch prop
      onSearch(searchQuery);
      
      // Mock delay for loading state
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    } else {
      setIsOpen(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    onConversationSelect(conversationId);
    setIsOpen(false);
    setQuery('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          placeholder="Search conversations..."
          className="w-full px-4 py-3.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" // Updated padding and font-size
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 w-full max-w-md"> {/* Full-width on mobile */}
          {isLoading ? (
            <div className="px-4 py-6 text-center">
              <div className="w-6 h-6 mx-auto border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Search Results */}
              {results.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Conversations
                  </div>
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectConversation(result.id)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{result.title}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>{result.message_count} messages</span>
                          <span>•</span>
                          <span>{formatDate(result.updated_at)}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Quick Suggestions */}
              {query.length > 0 && results.length === 0 && !isLoading && (
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    No results found
                  </div>
                  <div className="px-4 py-3 text-sm text-gray-500">
                    Try searching for different terms
                  </div>
                </div>
              )}

              {suggestions.length > 0 && query.length === 0 && (
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Quick Searches
                  </div>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => {
                        setQuery(suggestion.title);
                        handleSearch(suggestion.title);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-700"
                    >
                      {suggestion.title}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;