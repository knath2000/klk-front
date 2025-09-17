"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TranslationProvider, useTranslation } from '@/context/TranslationContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { setupTranslationHandlers, sendTranslationRequest, generateRequestId, TranslationResult, TranslationDelta } from '@/lib/translationWebSocket';
import dynamic from 'next/dynamic';
import { ResultsContainer } from '@/components/translation/ResultsContainer';
import { LoadingSkeleton } from '@/components/translation/LoadingSkeleton';
import { ErrorDisplay } from '@/components/translation/ErrorDisplay';
import ErrorBoundary from '@/components/translation/ErrorBoundary';

// Make SearchContainer client-only to avoid SSR hydration issues
const SearchContainer = dynamic(() => import('@/components/translation/SearchContainer').then(mod => ({ default: mod.SearchContainer })), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-16 rounded-xl"></div>
});

// Helper function to format TranslationResult for storage
const formatTranslationResult = (result: TranslationResult): string => {
  let formatted = '';

  // Add definitions
  if (result.definitions && Array.isArray(result.definitions) && result.definitions.length > 0) {
    formatted += 'Definitions:\n';
    result.definitions.forEach((def, index) => {
      const text = def.text || def.meaning || 'No definition available';
      formatted += `${index + 1}. ${text}`;
      if (def.partOfSpeech || def.pos) formatted += ` (${def.partOfSpeech || def.pos})`;
      formatted += '\n';
      if (def.examples && def.examples.length > 0) {
        formatted += `   Examples: ${def.examples.join(', ')}\n`;
      }
    });
  }

  // Add examples
  if (result.examples && Array.isArray(result.examples) && result.examples.length > 0) {
    formatted += '\nExamples:\n';
    result.examples.forEach((example, index) => {
      const text = example.text || example.spanish || 'No example';
      formatted += `${index + 1}. ${text}`;
      if (example.translation || example.english) formatted += ` → ${example.translation || example.english}`;
      formatted += '\n';
    });
  }

  // Add conjugations
  if (result.conjugations && typeof result.conjugations === 'object') {
    formatted += '\nConjugations:\n';
    Object.entries(result.conjugations).forEach(([tense, forms]) => {
      formatted += `${tense}:\n`;
      if (Array.isArray(forms)) {
        forms.forEach((form: unknown, index: number) => {
          formatted += `  ${index + 1}: ${String(form)}\n`;
        });
      } else if (typeof forms === 'object' && forms !== null) {
        Object.entries(forms as Record<string, unknown>).forEach(([pronoun, form]) => {
          formatted += `  ${pronoun}: ${String(form)}\n`;
        });
      }
    });
  }

  // Add audio
  if (result.audio) {
    if (Array.isArray(result.audio) && result.audio.length > 0) {
      formatted += '\nPronunciation:\n';
      result.audio.forEach((audio, index) => {
        formatted += `${index + 1}. ${audio.pronunciation || audio.text || 'Audio available'}\n`;
      });
    } else if (typeof result.audio === 'object' && result.audio !== null && 'ipa' in result.audio) {
      const audioObj = result.audio as { ipa?: string; suggestions?: string[] };
      if (audioObj.ipa) {
        formatted += `\nPronunciation: ${audioObj.ipa}\n`;
      }
    }
  }

  // Add related words
  if (result.related) {
    if (Array.isArray(result.related) && result.related.length > 0) {
      formatted += '\nRelated:\n';
      result.related.forEach((related) => {
        formatted += `- ${related.word} (${related.type})\n`;
      });
    } else if (typeof result.related === 'object' && result.related !== null) {
      const relatedObj = result.related as { synonyms?: string[]; antonyms?: string[] };
      if (relatedObj.synonyms && relatedObj.synonyms.length > 0) {
        formatted += `\nSynonyms: ${relatedObj.synonyms.join(', ')}\n`;
      }
      if (relatedObj.antonyms && relatedObj.antonyms.length > 0) {
        formatted += `\nAntonyms: ${relatedObj.antonyms.join(', ')}\n`;
      }
    }
  }

  return formatted.trim() || 'Translation completed';
};

function TranslatePageContent() {
  const { state, dispatch } = useTranslation();
  const { socket, isConnected } = useWebSocket();
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [streamingResult, setStreamingResult] = useState<string>('');

  // WebSocket connection for translation streaming
  useEffect(() => {
    if (!socket) return;

    const handleTranslationDelta = (delta: TranslationDelta) => {
      console.log('📄 Translation delta received:', delta.index, '/', delta.total);
      setStreamingResult(prev => prev + delta.chunk);
    };

    const handleTranslationResult = (result: TranslationResult) => {
      console.log('✅ Translation complete:', result.id);

      // Convert TranslationResult to string for storage
      const resultString = formatTranslationResult(result);

      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'ADD_TO_HISTORY', payload: {
        query: result.query,
        language: 'spanish', // Default language, can be made dynamic
        result: resultString
      }});
    };

    const handleTranslationError = (error: string) => {
      console.error('❌ Translation error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_ERROR', payload: error });
    };

    // Setup WebSocket handlers
    const cleanup = setupTranslationHandlers(
      socket,
      handleTranslationDelta,
      handleTranslationResult,
      handleTranslationError
    );

    return cleanup;
  }, [socket, dispatch]);

  const handleQuerySubmit = async (query: string) => {
    try {
      if (!socket || !isConnected) {
        throw new Error('WebSocket connection not available. Please try again.');
      }

      // Reset any previous error state and set loading
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      setCurrentQuery(query);
      setStreamingResult('');

      const requestId = generateRequestId();
      const translationRequest = {
        query,
        language: 'spanish', // Default language, can be made dynamic
        timestamp: Date.now(),
        id: requestId
      };

      sendTranslationRequest(socket, translationRequest);
      console.log('📤 Translation request sent:', requestId);
    } catch (error) {
      console.error('❌ Submission error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to send translation request' });
    }
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
      <ErrorBoundary>
        <TranslatePageContent />
      </ErrorBoundary>
    </TranslationProvider>
  );
}
