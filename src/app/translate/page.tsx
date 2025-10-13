'use client';

import { useState, useEffect } from 'react';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import useAnimationsReady from '@/hooks/useAnimationsReady';
import { TranslationProvider, useTranslation } from '@/context/TranslationContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { useConversations } from '@/context/ConversationsContext';
import { setupTranslationHandlers, sendTranslationRequest, generateRequestId, TranslationResult, TranslationDelta } from '@/lib/translationWebSocket';
import { translateViaRest, getOrCreateAnonId } from '@/lib/translateClient';
import dynamic from 'next/dynamic';
import { ResultsContainer } from '@/components/translation/ResultsContainer';
import { LoadingSkeleton } from '@/components/translation/LoadingSkeleton';
import { ErrorDisplay } from '@/components/translation/ErrorDisplay';
import ErrorBoundary from '@/components/translation/ErrorBoundary';
import { cn } from '@/lib/utils';
import ChatShell from '@/components/ChatShell';

// Make SearchContainer client-only to avoid SSR hydration issues
const SearchContainer = dynamic(() => import('@/components/translation/SearchContainer').then(mod => ({ default: mod.SearchContainer })), {
  ssr: false,
  loading: () => (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 animate-pulse">
      <div className="animate-pulse bg-white/10 h-16 rounded-xl" />
    </div>
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
  const { state, dispatch, isReadyForTranslation } = useTranslation();
  const animationsReady = useAnimationsReady();
  const { socket, isConnected } = useWebSocket();
  const conversations = useConversations();
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [streamingResult, setStreamingResult] = useState<string>('');
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  // Consider any streaming text or a finalized result as a successful outcome
  const hasResult = Boolean(translationResult) || Boolean(streamingResult);

  // Refresh conversations on page focus
  useEffect(() => {
    const handleFocus = () => {
      if (conversations) {
        conversations.refresh();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [conversations]);

  // ... existing code ...
  const handleQueryClear = () => {
    setCurrentQuery('');
    setStreamingResult('');
    setTranslationResult(null);
    dispatch({ type: 'SET_LOADING', payload: false });
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  // WebSocket connection for translation streaming
  useEffect(() => {
    if (!socket) return;

    const handleTranslationDelta = (delta: TranslationDelta) => {
      console.log('📄 Translation delta received:', delta.index, '/', delta.total);
      // Clear any stale error once we start receiving deltas
      dispatch({ type: 'SET_ERROR', payload: null });
      setStreamingResult(prev => prev + delta.chunk);
    };

    const handleTranslationResult = (result: TranslationResult) => {
      console.log('✅ Frontend received translation result:', result.id, 'keys:', Object.keys(result), 'definitions count:', result.definitions?.length || 0);

      // Set the translation result for display
      // Ensure any prior error is cleared so the UI shows results
      dispatch({ type: 'SET_ERROR', payload: null });
      setTranslationResult(result);

      // Convert TranslationResult to string for storage
      const resultString = formatTranslationResult(result);

      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'ADD_TO_HISTORY', payload: {
        query: result.query,
        language: 'spanish', // Default language label, can be made dynamic (UI label only)
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

    // Add fallback event handler
    socket.on('translation_fallback', ({ transport, reason }) => {
      console.warn('🔄 Server fallback triggered:', transport, reason);
      console.log(`Using fallback: ${transport}`);
    });

    return () => {
      cleanup();
      socket.off('translation_fallback');
    };
  }, [socket, dispatch]);

  const handleQuerySubmit = async (query: string) => {
    try {
      // Always clear stale error and set loading at the start of a submission
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Diagnostic: log environment and socket state
      console.log('[TranslatePage] handleQuerySubmit called', { query, isReadyForTranslation, socketExists: !!socket, socketId: socket?.id, socketConnected: !!socket?.connected, isConnected });
      console.log('[TranslatePage] Raw query entering handleQuerySubmit:', { query, type: typeof query });

      // If the socket is not available, always use REST fallback (covers guest and env cases)
      const socketAvailable = !!socket && (socket.connected || isConnected);

      if (!socketAvailable) {
        console.warn('[TranslatePage] Socket unavailable; using REST fallback for translation', { query });
        // UI validation: reject empty queries early
        if (!query || !String(query).trim()) {
          dispatch({ type: 'SET_LOADING', payload: false });
          dispatch({ type: 'SET_ERROR', payload: 'Please enter text before translating' });
          return;
        }

        // Build safe REST params with sensible defaults and log them
        const anonId = getOrCreateAnonId();
        const safeParams = {
          text: String(query || '').trim(),
          sourceLang: 'en',
          targetLang: 'es',
          context: undefined,
          userId: anonId
        };

        console.log('[TranslatePage] REST fallback - sending safeParams preview:', {
          textPreview: safeParams.text.slice(0, 200),
          sourceLang: safeParams.sourceLang,
          targetLang: safeParams.targetLang,
          hasUserId: !!safeParams.userId
        });

        try {
          const restResp = await translateViaRest(safeParams);
          // Map REST response into translationResult shape used by the page
          const mapped: TranslationResult = {
            id: restResp.metadata?.requestId || `translate_rest_${Date.now()}`,
            query: safeParams.text,
            definitions: restResp.definitions || [],
            examples: restResp.examples || [],
            conjugations: restResp.conjugations || {},
            audio: restResp.audio || undefined,
            related: restResp.related || undefined,
            entry: (restResp.entry as any) || undefined,
            timestamp: Date.now()
          };

          setTranslationResult(mapped);
          dispatch({ type: 'SET_LOADING', payload: false });
          dispatch({ type: 'ADD_TO_HISTORY', payload: { query: mapped.query, language: 'spanish', result: formatTranslationResult(mapped) }});
          return;
        } catch (restErr: any) {
          console.error('[TranslatePage] REST translation failed:', restErr);
          dispatch({ type: 'SET_LOADING', payload: false });
          dispatch({ type: 'SET_ERROR', payload: restErr?.message || 'Backend error' });
          return;
        }
      }

      // Otherwise prefer WebSocket streaming path
      if (!socket) {
        throw new Error('WebSocket connection not available. Please try again.');
      }

      if (!socket.connected) {
        console.log('🔄 Socket not connected, attempting quick reconnect before sending...');
        try {
          socket.connect();
          await new Promise<void>((resolve, reject) => {
            if (socket.connected) return resolve();
            const onConnect = () => {
              socket.off('connect_error', onError);
              resolve();
            };
            const onError = () => {};
            socket.once('connect', onConnect);
            socket.once('connect_error', onError);
            const timer = setTimeout(() => {
              socket.off('connect', onConnect);
              socket.off('connect_error', onError);
              reject(new Error('WebSocket connection timeout'));
            }, 3000);
            if (socket.connected) {
              clearTimeout(timer);
              socket.off('connect', onConnect);
              socket.off('connect_error', onError);
              resolve();
            }
          });
        } catch (e) {
          console.error('❌ Reconnect attempt failed before send:', e);
          // fallback to REST if reconnect fails
          try {
            const anonId = getOrCreateAnonId();
            const restResp = await translateViaRest({
              text: query,
              sourceLang: 'en',
              targetLang: 'es',
              context: undefined,
              userId: anonId,
            });
            const mapped: TranslationResult = {
              id: restResp.metadata?.requestId || `rest-${Date.now()}`,
              query,
              definitions: restResp.definitions || [],
              examples: restResp.examples || [],
              conjugations: restResp.conjugations || {},
              audio: restResp.audio as any,
              related: restResp.related as any,
              entry: restResp.entry as any,
              timestamp: Date.now()
            };
            setStreamingResult('');
            setTranslationResult(mapped);
            dispatch({ type: 'SET_LOADING', payload: false });
            dispatch({ type: 'ADD_TO_HISTORY', payload: {
              query,
              language: 'spanish',
              result: formatTranslationResult(mapped)
            }});
            return;
          } catch (restErr: any) {
            console.error('❌ REST fallback after reconnect failed:', restErr);
            // Surface the REST fallback error, but do not throw to avoid masking later success
            dispatch({ type: 'SET_LOADING', payload: false });
            dispatch({ type: 'SET_ERROR', payload: restErr instanceof Error ? restErr.message : 'Translation service not available. Please try again later.' });
            return;
          }
        }
      }

      // Reset any previous error state and set loading
      // (handled at submission start)

      setCurrentQuery(query);
      setStreamingResult('');

      const requestId = generateRequestId();
      const translationRequest = {
        query,
        language: 'en', // Normalize to server-expected code; server sets targetLang:'es'
        timestamp: Date.now(),
        id: requestId
      };

      sendTranslationRequest(socket, translationRequest);
      console.log('📤 Translation request sent:', requestId);
    } catch (error) {
      console.error('handleQuerySubmit error', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message || 'Unknown error' });
    }
  };

  const handleRetry = () => {
    if (currentQuery) {
      handleQuerySubmit(currentQuery);
    }
  };

  return (
    <ChatShell>
      <div className="relative flex-1 overflow-y-auto">
        {/* Translation-specific background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 opacity-90" />
          <div className="absolute top-32 left-10 md:left-32 w-60 md:w-72 h-60 md:h-72 bg-emerald-400/15 rounded-full blur-3xl animate-glass-pulse" />
          <div className="absolute bottom-32 right-10 md:right-32 w-72 md:w-96 h-72 md:h-96 bg-teal-400/10 rounded-full blur-3xl animate-glass-float" />
          <div
            className="absolute top-2/3 left-1/4 w-56 md:w-64 h-56 md:h-64 bg-cyan-400/12 rounded-full blur-3xl animate-glass-pulse"
            style={{ animationDelay: '1.5s' }}
          />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
          {/* Header (idle-gated animations) */}
          {animationsReady ? (
            <LazyMotion features={domAnimation}>
              <m.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                  <m.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="text-5xl mb-4">
                    📚
                  </m.div>
                  <h1 className="text-4xl font-bold text-white mb-2">Spanish Translation</h1>
                  <p className="text-lg text-white/80">Get instant translations with regional context and examples</p>
                </div>
              </m.div>
            </LazyMotion>
          ) : (
            <div className="text-center mb-8">
              <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                <div className="text-5xl mb-4">📚</div>
                <h1 className="text-4xl font-bold text-white mb-2">Spanish Translation</h1>
                <p className="text-lg text-white/80">Get instant translations with regional context and examples</p>
              </div>
            </div>
          )}

          {/* Search Container */}
          {animationsReady ? (
            <LazyMotion features={domAnimation}>
              <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
                <SearchContainer onQuerySubmit={handleQuerySubmit} onQueryClear={handleQueryClear} isLoading={state.isLoading} />
              </m.div>
            </LazyMotion>
          ) : (
            <div className="mb-8">
              <SearchContainer onQuerySubmit={handleQuerySubmit} onQueryClear={handleQueryClear} isLoading={state.isLoading} />
            </div>
          )}

          {/* Inline Help Button - Repositioned from floating */}
          {animationsReady ? (
            <LazyMotion features={domAnimation}>
              <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
                <div className="cursor-pointer max-w-max mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 transition-colors">
                  <div className="flex items-center gap-2 text-white px-4 py-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">Help</span>
                  </div>
                </div>
              </m.div>
            </LazyMotion>
          ) : (
            <div className="mb-8">
              <div className="cursor-pointer max-w-max mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 transition-colors">
                <div className="flex items-center gap-2 text-white px-4 py-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">Help</span>
                </div>
              </div>
            </div>
          )}

          {/* Results Container */}
          {currentQuery && (animationsReady ? (
            <LazyMotion features={domAnimation}>
              <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                {state.isLoading && !hasResult ? (
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
                    <LoadingSkeleton />
                  </div>
                ) : (!hasResult && state.error) ? (
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
                    <ErrorDisplay error={state.error} onRetry={handleRetry} />
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
                    <ResultsContainer query={currentQuery} streamingResult={streamingResult} onStreamingUpdate={setStreamingResult} result={translationResult} />
                  </div>
                )}
              </m.div>
            </LazyMotion>
          ) : (
            <div>
              {state.isLoading && !hasResult ? (
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
                  <LoadingSkeleton />
                </div>
              ) : (!hasResult && state.error) ? (
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
                  <ErrorDisplay error={state.error} onRetry={handleRetry} />
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
                  <ResultsContainer query={currentQuery} streamingResult={streamingResult} onStreamingUpdate={setStreamingResult} result={translationResult} />
                </div>
              )}
            </div>
          ))}

          {/* History Section */}
          {state.history.length > 0 && !currentQuery && (
            animationsReady ? (
              <LazyMotion features={domAnimation}>
                <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-12">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                    <h2 className="text-2xl font-semibold text-white mb-6">Recent Translations</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      {state.history.slice(0, 6).map((item, index) => (
                        <m.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }}>
                          <div className="cursor-pointer bg-white/10 backdrop-blr-md border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-colors" onClick={() => handleQuerySubmit(item.query)}>
                            <p className="font-medium text-white">{item.query}</p>
                            <p className="text-sm text-white/60 mt-1">{item.timestamp.toLocaleDateString()}</p>
                          </div>
                        </m.div>
                      ))}
                    </div>
                  </div>
                </m.div>
              </LazyMotion>
            ) : (
              <div className="mt-12">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                  <h2 className="text-2xl font-semibold text-white mb-6">Recent Translations</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {state.history.slice(0, 6).map((item) => (
                      <div key={item.id} className="cursor-pointer bg-white/10 backdrop-blr-md border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-colors" onClick={() => handleQuerySubmit(item.query)}>
                        <p className="font-medium text-white">{item.query}</p>
                        <p className="text-sm text-white/60 mt-1">{item.timestamp.toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </ChatShell>
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
