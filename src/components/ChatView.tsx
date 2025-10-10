'use client';

import { useState, useEffect, useRef, useMemo, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Message,
  Persona,
  ChatState
} from '@/types/chat';
import CountrySelector from './CountrySelector';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';
import ModelSelector from './ModelSelector';
import SearchBar from './SearchBar';
import { useWebSocket } from '@/context/WebSocketContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import clsx from 'clsx';
import { getNeonAuthToken } from '@/lib/neonAuth';
import { useOptionalConversations } from '@/context/ConversationsContext';
import { Plus, Mic } from 'lucide-react';

// Fallback personas data (includes all personas including Dominican Republic)
const fallbackPersonas: Persona[] = [
  {
    id: 'mex',
    country_key: 'mex',
    displayName: 'México',
    locale_hint: 'Español mexicano',
    prompt_text: 'Eres un asistente de IA. Debes responder siempre en español mexicano...',
    safe_reviewed: true,
    created_by: 'system',
    created_at: new Date().toISOString()
  },
  {
    id: 'arg',
    country_key: 'arg',
    displayName: 'Argentina',
    locale_hint: 'Español argentino',
    prompt_text: 'Eres un asistente de IA. Debes responder siempre en español argentino...',
    safe_reviewed: true,
    created_by: 'system',
    created_at: new Date().toISOString()
  },
  {
    id: 'esp',
    country_key: 'esp',
    displayName: 'España',
    locale_hint: 'Español peninsular',
    prompt_text: 'Eres un asistente de IA. Debes responder siempre en español de España...',
    safe_reviewed: true,
    created_by: 'system',
    created_at: new Date().toISOString()
  },
  {
    id: 'dom',
    country_key: 'dom',
    displayName: 'República Dominicana',
    locale_hint: 'Español dominicano',
    prompt_text: 'Eres un asistente dominicano de Santo Domingo que habla español dominicano auténtico...',
    safe_reviewed: true,
    created_by: 'system',
    created_at: new Date().toISOString()
  }
];

// Payload types for Socket.IO events
type AssistantDeltaPayload = {
  message_id: string;
  chunk: string;
  index?: number;
  total?: number | null;
};

type AssistantFinalPayload = {
  message_id: string;
  final_content: string;
  timestamp?: string;
  conversationId?: string;
};

type HistoryLoadedPayload = {
  conversationId: string;
  messages: Message[];
  timestamp: string;
};

interface ChatViewProps {
  onFooterChange?: (node: ReactNode | null) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ onFooterChange }) => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    selectedCountry: null,
    isTyping: false,
    isConnected: false,
    personas: [],
    currentModel: 'meta-llama/llama-3.2-3b-instruct' // Default model (cheapest, fast): Llama 3.2 3B Instruct
  });

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false); // Derived from provider or local fallback

  const { socket, isConnected, connect, error: wsError } = useWebSocket();
  const { user } = useAuth();
  const conversationsCtx = useOptionalConversations();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const clearedGuestConversationRef = useRef(false);
  const hasFetchedPersonasRef = useRef(false);
  const personaFetchKeyRef = useRef<string | null>(null);
  const personaFetchInFlightRef = useRef(false);

  // Load conversationId from localStorage on mount
  useEffect(() => {
    const storedId = localStorage.getItem('chatConversationId');
    if (storedId) {
      setConversationId(storedId);
    }
  }, []);

  // Hydrate selected country from localStorage if present
  useEffect(() => {
    try {
      const storedCountry = localStorage.getItem('chatSelectedCountry');
      if (storedCountry) {
        setChatState(prev => ({ ...prev, selectedCountry: storedCountry }));
      }
    } catch (e) {
      // ignore localStorage errors
    }
  }, []);

  // Single derived loading state effect: align with provider if available, fallback for unauthenticated
  useEffect(() => {
    if (!isConnected) {
      setIsLoadingHistory(false);
      return;
    }

    if (conversationsCtx) {
      setIsLoadingHistory(Boolean(conversationId && conversationsCtx.historyLoadingId === conversationId));
    } else {
      setIsLoadingHistory(false);
    }
  }, [conversationsCtx?.historyLoadingId, conversationId, isConnected]);

  // Sync local conversationId with context activeId (if provider present)
  useEffect(() => {
    if (conversationsCtx?.activeId && conversationsCtx.activeId !== conversationId) {
      setConversationId(conversationsCtx.activeId);
    }
  }, [conversationsCtx?.activeId, conversationId]);

  // Clear stale conversationId if user is not authenticated, guard against repeated clears
  useEffect(() => {
    if (!user) {
      if (!clearedGuestConversationRef.current) {
        if (conversationId) {
          console.log('🔐 No auth user; clearing stale conversationId from localStorage');
        }
        setConversationId(null);
        localStorage.removeItem('chatConversationId');
        clearedGuestConversationRef.current = true;
      }
    } else {
      clearedGuestConversationRef.current = false;
    }
  }, [user, conversationId]);

  // Ensure initial viewport starts at the top so header/controls are visible on first paint.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  // Fetch personas from API - use full backend URL
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const fetchKey = `${backendUrl}|${user?.id ?? 'guest'}`;

    if (personaFetchInFlightRef.current) {
      return;
    }
    if (hasFetchedPersonasRef.current && personaFetchKeyRef.current === fetchKey) {
      return;
    }

    const fetchPersonasWithRetry = async (retries = 3) => {
      personaFetchInFlightRef.current = true;

      console.log('🔍 API CONFIGURATION:');
      console.log('   Backend URL:', backendUrl);
      console.log('   Environment:', process.env.NODE_ENV);
      console.log('   Is Production:', process.env.NODE_ENV === 'production');

      // Validate backend URL
      if (!backendUrl || backendUrl.includes('your-railway-app')) {
        console.error('❌ INVALID BACKEND URL:', backendUrl);
        console.error('   Please set NEXT_PUBLIC_BACKEND_URL to your actual backend URL');
        setChatState(prev => ({
          ...prev,
          personas: fallbackPersonas
        }));
        hasFetchedPersonasRef.current = true;
        personaFetchKeyRef.current = fetchKey;
        personaFetchInFlightRef.current = false;
        return;
      }

      for (let attempt = 1; attempt <= retries; attempt++) {
        console.log(`🔄 ATTEMPT ${attempt}/${retries}: Fetching personas from ${backendUrl}/api/personas`);

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          const response = await fetch(`${backendUrl}/api/personas`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          console.log('📊 API RESPONSE:');
          console.log('   Status:', response.status);
          console.log('   Status Text:', response.statusText);
          console.log('   Content-Type:', response.headers.get('content-type'));
          console.log('   URL:', response.url);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API ERROR RESPONSE:', errorText);

            // Check if it's a Next.js 404 page
            if (errorText.includes('<!DOCTYPE html>') && errorText.includes('404')) {
              console.error('🚨 DETECTED NEXT.JS 404 PAGE - Backend URL is incorrect or unreachable');
              console.error('   Expected JSON response but got HTML 404 page');
              console.error('   This usually means the backend URL is pointing to the frontend instead of backend');
              throw new Error('Backend URL appears to be incorrect - got Next.js 404 page');
            }

            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('❌ NON-JSON RESPONSE RECEIVED:');
            console.error('   Content-Type:', contentType);
            console.error('   Response Text (first 500 chars):', text.substring(0, 500));
            throw new Error('Response is not JSON');
          }

          const data = await response.json();
          console.log('✅ PERSONAS DATA RECEIVED:', data);

          if (!data.personas || !Array.isArray(data.personas)) {
            console.error('❌ INVALID DATA STRUCTURE:', data);
            throw new Error('Invalid personas data structure');
          }

          setChatState(prev => ({ ...prev, personas: data.personas }));
          console.log('🎉 PERSONAS LOADED SUCCESSFULLY:', data.personas.length, 'personas');
          hasFetchedPersonasRef.current = true;
          personaFetchKeyRef.current = fetchKey;
          personaFetchInFlightRef.current = false;
          return;
        } catch (error) {
          console.error(`💥 ERROR ON ATTEMPT ${attempt}/${retries}:`, error);

          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorName = error instanceof Error ? error.name : 'UnknownError';

          if (errorName === 'AbortError') {
            console.error('   Request timed out after 10 seconds');
          } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
            console.error('   Network error - backend may be unreachable');
            console.error('   Check if backend URL is correct and backend is running');
          }

          if (attempt === retries) {
            console.log('🔄 ALL RETRIES EXHAUSTED - FALLING BACK TO FALLBACK_PERSONAS');
            console.log('💡 TROUBLESHOOTING TIPS:');
            console.log('   1. Check if NEXT_PUBLIC_BACKEND_URL is set correctly in Vercel');
            console.log('   2. Verify the Railway backend is running and accessible');
            console.log('   3. Check browser console for CORS errors');
            console.log('   4. Try accessing the backend directly in a new tab');

            setChatState(prev => ({
              ...prev,
              personas: fallbackPersonas
            }));
            hasFetchedPersonasRef.current = true;
            personaFetchKeyRef.current = fetchKey;
            personaFetchInFlightRef.current = false;
            return;
          } else {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            console.log(`⏳ RETRYING IN ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      personaFetchInFlightRef.current = false;
    };

    void fetchPersonasWithRetry();

    return () => {
      // no-op cleanup
    };
  }, [user?.id]);

  // Handle history loaded event
  useEffect(() => {
    if (!socket) return;

    const handleHistoryLoaded = (data: HistoryLoadedPayload) => {
      console.log('📚 History loaded:', data.messages.length, 'messages');

      // Notify provider to clear loading state
      conversationsCtx?.notifyHistoryResolved(data.conversationId);

      // Normalize payload to frontend Message shape for alignment + timestamps
      const normalizedMessages: Message[] = (data.messages as any[]).map((m: any) => ({
        id: m.id ?? `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type: (m.type ?? m.role) as 'user' | 'assistant',
        content: m.content ?? m.text ?? '',
        timestamp:
          typeof m.timestamp === 'number'
            ? m.timestamp
            : m.created_at
              ? new Date(m.created_at).getTime()
              : m.createdAt
                ? new Date(m.createdAt).getTime()
                : Date.now(),
        country_key: m.country_key ?? m.persona_id
      }));

      setChatState(prev => ({
        ...prev,
        messages: normalizedMessages
      }));
      // Loading state is derived from provider, so no explicit clear needed here
      // Ensure conversationId is set
      setConversationId(data.conversationId);
      localStorage.setItem('chatConversationId', data.conversationId);
    };

    socket.on('history_loaded', handleHistoryLoaded);

    return () => {
      socket.off('history_loaded', handleHistoryLoaded);
    };
  }, [socket, conversationsCtx]);

  // Handle conversation created event from server
  useEffect(() => {
    if (!socket) return;

    const handleConversationCreated = (data: { conversationId: string; userId: string }) => {
      console.log('🆕 Conversation created:', data.conversationId);
      setConversationId(data.conversationId);
      localStorage.setItem('chatConversationId', data.conversationId);
      conversationsCtx?.setActive(data.conversationId);
      void conversationsCtx?.refresh();
    };

    socket.on('conversation_created', handleConversationCreated);

    return () => {
      socket.off('conversation_created', handleConversationCreated);
    };
  }, [socket, conversationsCtx]);

  // WebSocket connection is now managed by global context
  useEffect(() => {
    if (!socket) return;

    // Set up chat-specific event handlers
    socket.on('assistant_delta', (data: AssistantDeltaPayload) => {
      console.log('📨 RECEIVED assistant_delta:', data);
      updateAssistantMessage(data.message_id, data.chunk, false);
    });

    socket.on('assistant_final', (data: AssistantFinalPayload) => {
      console.log('📨 RECEIVED assistant_final:', data);
      updateAssistantMessage(data.message_id, data.final_content, true);
      // Handle conversationId if provided in final response
      if (data.conversationId) {
        setConversationId(data.conversationId);
        localStorage.setItem('chatConversationId', data.conversationId);
      }
    });

    // Update connection state based on global context
    setChatState(prev => ({ ...prev, isConnected }));

    return () => {
      // Only remove chat-specific listeners, don't disconnect socket
      socket.off('assistant_delta');
      socket.off('assistant_final');
    };
  }, [socket, isConnected]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // Do not auto-scroll on initial load when there are no messages and not typing,
    // otherwise the page may jump past the header/controls.
    if (chatState.messages.length === 0 && !chatState.isTyping) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatState.messages, chatState.isTyping]);

  const handleCountrySelect = (countryKey: string) => {
    console.log('Country selected:', countryKey);
    setChatState(prev => ({ ...prev, selectedCountry: countryKey }));
    try {
      localStorage.setItem('chatSelectedCountry', countryKey);
    } catch (e) {
      // ignore storage errors
    }
  };

  const handleModelChange = (modelId: string) => {
    setChatState(prev => ({ ...prev, currentModel: modelId }));
    // In a real implementation, this would also update the backend
    console.log('Model changed to:', modelId);
  };

  const handleSearch = (query: string) => {
    // In a real implementation, this would search conversations
    console.log('Searching for:', query);
  };

  const selectedCountry = chatState.selectedCountry;
  const currentModel = chatState.currentModel;

  const handleSendMessage = useCallback(async (message: string) => {
    // Require a selected country client-side
    if (!selectedCountry) {
      console.error('❌ Cannot send message: no country selected');
      return;
    }

    // If we don't yet have a socket instance, ask the context to connect and wait briefly for it.
    if (!socket) {
      console.log('🔌 No socket instance available; requesting WebSocket context to connect...');
      try {
        if (typeof connect === 'function') {
          connect();
        }
        // Wait up to 3s for isConnected to become true
        await new Promise<void>((resolve, reject) => {
          const maxWait = 3000;
          const intervalMs = 100;
          let waited = 0;
          const poll = setInterval(() => {
            if (isConnected) {
              clearInterval(poll);
              return resolve();
            }
            waited += intervalMs;
            if (waited >= maxWait) {
              clearInterval(poll);
              return reject(new Error('WebSocket connection timeout'));
            }
          }, intervalMs);
        });
      } catch (err) {
        console.warn('🔌 Socket did not become available in time; send will be attempted only if socket connects later.', err);
        // We continue — handleSend below will handle socket.connected checks and attempt reconnect if possible.
      }
    }

    // If socket exists but is not connected, try a quick reconnect window (existing logic)
    if (socket && !socket.connected) {
      console.log('🔄 Socket not connected, attempting quick reconnect before sending...');
      try {
        if (typeof connect === 'function') {
          connect();
        } else {
          socket.connect();
        }

        await new Promise<void>((resolve, reject) => {
          if (socket.connected) return resolve();
          const onConnect = () => {
            socket.off('connect_error', onError);
            resolve();
          };
          const onError = () => {
            // swallow; rely on timeout
          };
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
        return;
      }
    }

    console.log('📤 SENDING MESSAGE:', { message, country: selectedCountry });

    // Generate consistent message ID that matches server expectations
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Generate conversationId if this is the first message
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      currentConversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setConversationId(currentConversationId);
      localStorage.setItem('chatConversationId', currentConversationId);
    }

    const userMessage: Message = {
      id: `user-${messageId}`, // Clear user message ID prefix
      type: 'user',
      content: message,
      timestamp: Date.now(),
      country_key: selectedCountry
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    // Send to server with the base message ID
    socket?.emit('user_message', {
      message,
      selected_country_key: selectedCountry,
      client_ts: Date.now(),
      message_id: messageId, // Send base ID to server
      model: currentModel,
      conversationId: currentConversationId
    });

    console.log('📤 MESSAGE SENT with ID:', messageId);
  }, [selectedCountry, socket, connect, isConnected, conversationId, currentModel]);

  // Provide an up-to-date footer slot to the shell whenever selection or connection state changes.
  useEffect(() => {
    if (!onFooterChange) return;

    const slot = (
      <div className="relative z-10 p-6 pt-2 pl-safe-l pr-safe-r mt-[clamp(8px,1.5vh,16px)]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#343541] border border-gray-700 rounded-lg p-3">
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={!selectedCountry}
              selectedCountry={selectedCountry}
            />
          </div>
        </div>
      </div>
    );

    onFooterChange(slot);
    return () => onFooterChange(null);
  }, [selectedCountry, isConnected, handleSendMessage, onFooterChange]);

  const selectedPersona = chatState.personas.find(p => p.country_key === chatState.selectedCountry);

  const hasMessages = chatState.messages.length > 0;

  // Helper function to update assistant messages from streaming
  const updateAssistantMessage = (messageId: string, content: string, isFinal: boolean) => {
    setChatState(prev => {
      // Look for existing assistant message with the same base ID
      const assistantMessageId = `assistant-${messageId}`;
      const existingMessageIndex = prev.messages.findIndex(msg => msg.id === assistantMessageId);

      if (existingMessageIndex >= 0) {
        // Update existing assistant message
        const updatedMessages = [...prev.messages];
        updatedMessages[existingMessageIndex] = {
          ...updatedMessages[existingMessageIndex],
          content: isFinal ? content : updatedMessages[existingMessageIndex].content + content,
          isStreaming: !isFinal,
          isComplete: isFinal
        };
        return {
          ...prev,
          messages: updatedMessages,
          isTyping: !isFinal
        };
      } else {
        // Create new assistant message with clear ID
        const newMessage: Message = {
          id: assistantMessageId, // Clear assistant message ID
          type: 'assistant',
          content,
          timestamp: Date.now(),
          isStreaming: !isFinal,
          isComplete: isFinal
        };
        return {
          ...prev,
          messages: [...prev.messages, newMessage],
          isTyping: !isFinal
        };
      }
    });
  };

  const isEmptyState = chatState.messages.length === 0 && !isLoadingHistory;

  // Debug render-state to help diagnose disabled input issues
  console.log('ChatView render:', { selectedCountry, isConnected, messagesCount: chatState.messages.length });

  return (
    <div className="flex flex-col gap-[var(--row-gap)] min-h-[100svh] h-[100vh] h-[100lvh]">
      {/* Header with glass design */}
      <div className="relative z-10 px-4 md:px-6 pl-safe-l pr-safe-r pt-4 md:pt-6 mt-0">
        <div className="max-w-7xl mx-auto flex flex-col gap-[var(--row-gap)]">
          <div className="bg-[#343541] border border-gray-700 rounded-lg p-4 py-3">
            <div className="flex items-center justify-between flex-wrap gap-3 xs:flex-nowrap">
              {/* Title Section */}
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[clamp(22px,5vw,26px)] md:text-3xl font-bold text-white mb-2" // Scaled title
                >
                  🇪🇸 AI Chat con Sabor Local
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-base md:text-lg md:text-xl text-white/80 leading-1.4" // Scaled body, line-height
                >
                  Conversa con IA que habla como la gente del lugar
                </motion.p>
              </div>

              {/* Connection Status */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2"
              >
                <div className={clsx(
                  "w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin",
                  chatState.isConnected ? "bg-emerald-400 shadow-emerald-400/50" : "bg-red-400 shadow-red-400/50"
                )} />
                <span className="text-sm text-white/80">
                  {chatState.isConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </motion.div>
            </div>

            {wsError === 'token-required' && (
              <div className="bg-yellow-500/10 border border-yellow-500/40 text-yellow-100 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Authentication required</span>
                  <span className="text-sm text-yellow-100/80">Please sign in to continue chatting.</span>
                </div>
              </div>
            )}
          </div>

          {/* Controls Row - Adjusted gap for mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[clamp(12px,3vh,16px)]">
            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="bg-[#343541] border border-gray-700 rounded-lg min-h-12 p-3 hover:bg-gray-800 transition-colors">
                <SearchBar
                  onSearch={handleSearch}
                  onConversationSelect={handleSearch}
                />
              </div>
            </motion.div>

            {/* Model Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-[#343541] border border-gray-700 rounded-lg min-h-12 p-3 hover:bg-gray-800 transition-colors">
                <ModelSelector
                  currentModel={chatState.currentModel || 'gpt-4o-mini'}
                  onModelChange={handleModelChange}
                  conversationId={conversationId || undefined}
                />
              </div>
            </motion.div>

            {/* Country Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-[#343541] border border-gray-700 rounded-lg min-h-12 p-3 hover:bg-gray-800 transition-colors">
                <CountrySelector
                  personas={chatState.personas}
                  selectedCountry={chatState.selectedCountry}
                  onCountrySelect={handleCountrySelect}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className={cn(
        hasMessages ? "flex-1 overflow-y-auto px-4 md:px-6 pl-safe-l pr-safe-r pb-32" : "px-4 md:px-6 pl-safe-l pr-safe-r pb-32"
      )}>
        <div className="max-w-4xl mx-auto">
          {/* Loading History Indicator */}
          {isLoadingHistory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-4"
            >
              <div className="inline-flex items-center gap-2 text-white/80">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Loading conversation history...
              </div>
            </motion.div>
          )}

          {/* Empty State Hero - Centered prompt with large input */}
          <AnimatePresence>
            {isEmptyState && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center min-h-[60vh] text-center py-8 md:py-12"
              >
                <motion.div
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-6xl md:text-7xl mb-6"
                >
                  🌎
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl md:text-3xl font-bold text-white mb-4"
                >
                  What can I help with?
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-base md:text-lg text-white/80 mb-8 max-w-md"
                >
                  Ask anything and I'll respond in local Spanish slang.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="w-full max-w-2xl"
                >
                  <div className="bg-[#343541] border border-gray-700 rounded-lg p-3">
                    {!selectedCountry ? (
                      <div className="flex items-center gap-2">
                        <Plus className="w-5 h-5 text-gray-400" />
                        <div className="flex-1 px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-left text-white/70">
                          Selecciona un país primero...
                        </div>
                        <Mic className="w-5 h-5 text-gray-400" />
                      </div>
                    ) : (
                      <div className="p-4 text-center text-white/80">
                        Estás listo. Escribe tu primer mensaje abajo.
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <AnimatePresence>
            {!isEmptyState && (
              <div className="flex flex-col">
                {chatState.messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Typing Indicator */}
          <TypingIndicator
            isVisible={chatState.isTyping}
            countryName={selectedPersona?.displayName}
          />

          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default ChatView;
