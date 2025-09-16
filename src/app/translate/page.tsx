"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TranslationProvider, useTranslation } from '@/context/TranslationContext';
import { SearchContainer } from '@/components/translation/SearchContainer';
import { ResultsContainer } from '@/components/translation/ResultsContainer';
import { LoadingSkeleton } from '@/components/translation/LoadingSkeleton';
import { ErrorDisplay } from '@/components/translation/ErrorDisplay';

function TranslatePageContent() {
  const { state, dispatch } = useTranslation();
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [streamingResult, setStreamingResult] = useState<string>('');

  // WebSocket connection for translation streaming
  useEffect(() => {
    // WebSocket integration will be added here
    // Listen for translation_delta and translation_final events
    return () => {
      // Cleanup WebSocket listeners
    };
  }, []);

  const handleQuerySubmit = (query: string) => {
    setCurrentQuery(query);
    setStreamingResult('');
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const handleRetry = () => {
    if (currentQuery) {
      handleQuerySubmit(currentQuery);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Spanish Translation
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Get instant translations with regional context and examples
          </p>
        </motion.div>

        {/* Search Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <SearchContainer onQuerySubmit={handleQuerySubmit} />
        </motion.div>

        {/* Results Container */}
        {currentQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {state.isLoading && !streamingResult ? (
              <LoadingSkeleton />
            ) : state.error ? (
              <ErrorDisplay error={state.error} onRetry={handleRetry} />
            ) : (
              <ResultsContainer
                query={currentQuery}
                streamingResult={streamingResult}
                onStreamingUpdate={setStreamingResult}
              />
            )}
          </motion.div>
        )}

        {/* History Section */}
        {state.history.length > 0 && !currentQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Recent Translations
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {state.history.slice(0, 6).map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleQuerySubmit(item.query)}
                >
                  <p className="font-medium text-gray-900 dark:text-white">
                    {item.query}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {item.timestamp.toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function TranslatePage() {
  return (
    <TranslationProvider>
      <TranslatePageContent />
    </TranslationProvider>
  );
}
