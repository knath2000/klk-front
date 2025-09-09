"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { SearchBar, ResultsTabs, LoadingSkeleton, ErrorDisplay, HistoryList, FavoritesList } from "@/components/translation";
import { TranslationProvider, useTranslation } from "@/context/TranslationContext";
import ErrorBoundary from "@/components/translation/ErrorBoundary";
import { Inter } from 'next/font/google';
import { createWebSocketConnection } from '../../lib/websocket';

// Add font configuration at the top
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

interface TranslationResult {
  definitions: Array<{
    text: string;
    partOfSpeech?: string;
    examples?: string[];
  }>;
  examples: Array<{
    spanish: string;
    english: string;
  }>;
  conjugations?: {
    present: Record<string, string>;
    past: Record<string, string>;
    future?: Record<string, string>;
  };
  audio?: Array<{
    url: string;
    type: "pronunciation" | "example";
    text: string;
  }>;
  related: string[];
}

// Add named import for Socket type only
import { Socket } from 'socket.io-client';

function TranslateContent() {
  const { addToHistory, clearHistory, addToFavorites, removeFromFavorites, isInFavorites, state } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<TranslationResult | null>(null);
  const [partialResults, setPartialResults] = useState<Partial<TranslationResult>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'history' | 'favorites'>('search');

  const socketRef = useRef<Socket | null>(null);
  const currentQueryRef = useRef<string>("");

  // Initialize WebSocket connection
  useEffect(() => {
    // Use the WebSocket utility function
    const socket = createWebSocketConnection(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001");

    socket.on("connect", () => {
      console.log("Connected to translation WebSocket");
    });

    socket.on("connect_error", (err: Error) => {
      console.error("WebSocket connection error:", err);
      setError("Failed to connect to translation service");
      setIsLoading(false);
      
      // Fix: Use optional chaining and type assertion for transports
      const transports = socket.io?.opts?.transports as string[] | undefined;
      if (transports?.includes('websocket')) {
        socket.io!.opts.transports = ['polling'] as const;
        socket.connect();
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from translation WebSocket");
      setIsStreaming(false);
    });

    // Add reconnection handler
    socket.on('reconnect', (attemptNumber: number) => {
      console.log('🔄 Translation WebSocket RECONNECTED after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_error', (error: Error) => {
      console.error('❌ Translation WebSocket RECONNECT ERROR:', error);
      // Attempt reconnection with exponential backoff
      const reconnectionAttempts = 5;
      setTimeout(() => {
        socket.connect();
      }, Math.min(1000 * Math.pow(2, reconnectionAttempts), 30000));
    });

    socket.on("translation_delta", (data: Partial<TranslationResult>) => {
      console.log("Received translation delta:", data);
      setPartialResults(prev => ({ ...prev, ...data }));
      setIsStreaming(true);
    });

    socket.on("translation_final", (data: TranslationResult) => {
      console.log("Received translation final:", data);
      setResults(data);
      setPartialResults({});
      setIsStreaming(false);
      setIsLoading(false);

      // Add to history
      addToHistory({
        query: currentQueryRef.current,
        language: "es",
        result: data.definitions[0]?.text || "Translation completed",
      });
    });

    socket.on("translation_error", (error: { message: string }) => {
      console.error("Translation error:", error);
      setError(error.message);
      setIsStreaming(false);
      setIsLoading(false);
    });

    socketRef.current = socket;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [addToHistory]);

  // Handle search submission
  const handleSearch = async (query: string, lang: string, context?: string) => {
    setSearchQuery(query);
    setIsLoading(true);
    setError(null);
    setResults(null);
    setPartialResults({});
    currentQueryRef.current = query;

    try {
      // Emit WebSocket event for translation request
      if (socketRef.current) {
        socketRef.current.emit("translation_request", {
          query,
          language: lang,
          context,
          timestamp: Date.now(),
        });
      }

      // Fallback to HTTP request if WebSocket fails
      setTimeout(() => {
        if (isLoading && !isStreaming) {
          console.log("WebSocket timeout, falling back to HTTP");
          fallbackToHttp(query, lang, context);
        }
      }, 5000);

    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "An error occurred during translation");
      setIsLoading(false);
    }
  };

  // Fallback HTTP request
  const fallbackToHttp = async (query: string, lang: string, context?: string) => {
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          language: lang,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
      setIsLoading(false);

      // Add to history
      addToHistory({
        query,
        language: lang,
        result: data.definitions[0]?.text || "Translation completed",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during translation");
      setIsLoading(false);
    }
  };

  // Handle related term clicks
  const handleRelatedClick = (term: string) => {
    handleSearch(term, "es");
  };

  // Handle history item clicks
  const handleHistoryClick = (query: string) => {
    handleSearch(query, "es");
  };

  // Handle favorites item clicks
  const handleFavoritesClick = (query: string) => {
    handleSearch(query, "es");
  };

  // Handle adding to favorites
  const handleAddToFavorites = (query: string, result?: string) => {
    addToFavorites({
      query,
      language: "es",
      result: result || "Added to favorites",
    });
  };

  // Load suggestions on component mount
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const response = await fetch("/api/translate/supported-languages");
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.languages || []);
        }
      } catch (err) {
        console.error("Failed to load suggestions:", err);
      }
    };

    loadSuggestions();
  }, []);

  // Combine partial and final results for display
  const displayResults = results || (Object.keys(partialResults).length > 0 ? partialResults as TranslationResult : null);

  return (
    <div className={`${inter.className} min-h-screen bg-gray-50 dark:bg-gray-900`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Spanish Translation
          </h1>
          <p className="text-lg text-gray-600">
            Translate words and phrases with regional Spanish context
          </p>
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"
              />
              Streaming results...
            </motion.div>
          )}
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div 
            role="tablist" 
            aria-label="Translation tabs"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex flex-wrap"
          >
            <button
              role="tab"
              aria-selected={activeTab === 'search'}
              aria-controls="search-panel"
              id="search-tab"
              onClick={() => setActiveTab('search')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTab('search');
                }
              }}
              tabIndex={0}
              className={`px-3 sm:px-6 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === 'search'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Search
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'history'}
              aria-controls="history-panel"
              id="history-tab"
              onClick={() => setActiveTab('history')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTab('history');
                }
              }}
              tabIndex={0}
              className={`px-3 sm:px-6 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              History ({state.history.length})
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'favorites'}
              aria-controls="favorites-panel"
              id="favorites-tab"
              onClick={() => setActiveTab('favorites')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTab('favorites');
                }
              }}
              tabIndex={0}
              className={`px-3 sm:px-6 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === 'favorites'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Favorites ({state.favorites.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div role="tabpanel" id="search-panel" hidden={activeTab !== 'search'}>
          {activeTab === 'search' && (
            <>
              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <SearchBar
                  onSubmit={handleSearch}
                  suggestions={suggestions}
                  isLoading={isLoading}
                />
              </motion.div>

              {/* Loading State */}
              {isLoading && !isStreaming && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-8"
                >
                  <LoadingSkeleton />
                </motion.div>
              )}

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <ErrorDisplay
                    message={error}
                    onRetry={() => handleSearch(searchQuery, "es")}
                  />
                </motion.div>
              )}

              {/* Results */}
              {displayResults && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <ResultsTabs
                    results={displayResults}
                    query={searchQuery}
                    onRelatedClick={handleRelatedClick}
                    onAddToFavorites={handleAddToFavorites}
                    isInFavorites={isInFavorites}
                  />
                </motion.div>
              )}

              {/* Empty State */}
              {!displayResults && !isLoading && !error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-center py-16"
                >
                  <div className="max-w-md mx-auto">
                    <svg
                      className="mx-auto h-24 w-24 text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v3m-6 8h2m-2 4h2m2-4h2m-2 4h2M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Start Translating
                    </h3>
                    <p className="text-gray-500">
                      Enter a word or phrase above to get detailed translations with regional Spanish context.
                    </p>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>

        <div role="tabpanel" id="history-panel" hidden={activeTab !== 'history'}>
          <HistoryList
            history={state.history}
            onItemClick={handleHistoryClick}
            onClearHistory={clearHistory}
            isLoading={state.isLoading}
          />
        </div>

        <div role="tabpanel" id="favorites-panel" hidden={activeTab !== 'favorites'}>
          <FavoritesList
            favorites={state.favorites}
            onItemClick={handleFavoritesClick}
            onRemoveFavorite={removeFromFavorites}
            isLoading={state.isLoading}
          />
        </div>
      </div>
    </div>
  );
}

export default function TranslatePage() {
  return (
    <TranslationProvider>
      <ErrorBoundary>
        <TranslateContent />
      </ErrorBoundary>
    </TranslationProvider>
  );
}
