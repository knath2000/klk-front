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
import { GlassCard } from '@/components/ui';
import { cn } from '@/lib/utils';

// Make SearchContainer client-only to avoid SSR hydration issues
const SearchContainer = dynamic(() => import('@/components/translation/SearchContainer').then(mod => ({ default: mod.SearchContainer })), {
  ssr: false,
  loading: () => (
    <GlassCard variant="light" size="md" animate>
      <div className="animate-pulse bg-white/10 h-16 rounded-xl" />
    </GlassCard>
  )
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
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);

  // WebSocket connection for translation streaming
  useEffect(() => {
    if (!socket) return;

    const handleTranslationDelta = (delta: TranslationDelta) => {
      console.log('📄 Translation delta received:', delta.index, '/', delta.total);
      setStreamingResult(prev => prev + delta.chunk);
    };

    const handleTranslationResult = (result: TranslationResult) => {
      console.log('✅ Frontend received translation result:', result.id, 'keys:', Object.keys(result), 'definitions count:', result.definitions?.length || 0);

      // Set the translation result for display
      setTranslationResult(result);

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
    <div className="min-h-screen">
      {/* Translation-specific background */}
      <div className="fixed inset-0 -z-20">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 opacity-90" />
        
        {/* Translation-specific floating orbs */}
        <div className="absolute top-32 left-32 w-72 h-72 bg-emerald-400/15 rounded-full blur-3xl animate-glass-pulse" />
        <div className="absolute bottom-32 right-32 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-glass-float" />
        <div 
          className="absolute top-2/3 left-1/4 w-64 h-64 bg-cyan-400/12 rounded-full blur-3xl animate-glass-pulse" 
          style={{ animationDelay: '1.5s' }} 
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <GlassCard variant="emerald" size="lg" gradient className="max-w-2xl mx-auto">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-5xl mb-4"
            >
              📚
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Spanish Translation
            </h1>
            <p className="text-lg text-white/80">
              Get instant translations with regional context and examples
            </p>
          </GlassCard>
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
              <GlassCard variant="light" size="lg" animate>
                <LoadingSkeleton />
              </GlassCard>
            ) : state.error ? (
              <GlassCard variant="purple" size="lg" animate>
                <ErrorDisplay error={state.error} onRetry={handleRetry} />
              </GlassCard>
            ) : (
              <GlassCard variant="light" size="lg" animate>
                <ResultsContainer
                  query={currentQuery}
                  streamingResult={streamingResult}
                  onStreamingUpdate={setStreamingResult}
                  result={translationResult}
                />
              </GlassCard>
            )}
          </motion.div>
        )}

        {/* History Section */}
        {state.history.length > 0 && !currentQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12"
          >
            <GlassCard variant="dark" size="lg">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Recent Translations
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {state.history.slice(0, 6).map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <GlassCard 
                      variant="light" 
                      size="sm" 
                      hover 
                      className="cursor-pointer"
                      onClick={() => handleQuerySubmit(item.query)}
                    >
                      <p className="font-medium text-white">
                        {item.query}
                      </p>
                      <p className="text-sm text-white/60 mt-1">
                        {item.timestamp.toLocaleDateString()}
                      </p>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Floating help button */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="fixed bottom-8 right-8"
        >
          <GlassCard variant="blue" size="sm" hover floating className="cursor-pointer">
            <div className="flex items-center gap-2 text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">Help</span>
            </div>
          </GlassCard>
        </motion.div>
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
