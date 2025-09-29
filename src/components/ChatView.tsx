'use client';

import { useState, useEffect, useRef } from 'react';
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
import { GlassCard } from '@/components/ui';
import { cn } from '@/lib/utils';
import clsx from 'clsx';

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

const ChatView: React.FC = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    selectedCountry: null,
    isTyping: false,
    isConnected: false,
    personas: [],
    currentModel: 'meta-llama/llama-3.2-3b-instruct' // Default model (cheapest, fast): Llama 3.2 3B Instruct
  });

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const { socket, isConnected, connect } = useWebSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversationId from localStorage on mount
  useEffect(() => {
    const storedId = localStorage.getItem('chatConversationId');
    if (storedId) {
      setConversationId(storedId);
    }
  }, []);

  // Clear stale conversationId if user is not authenticated
  useEffect(() => {
    if (!user && conversationId) {
      console.log('🔐 No auth user; clearing stale conversationId from localStorage');
      setConversationId(null);
      localStorage.removeItem('chatConversationId');
    }
  }, [user, conversationId]);

  // Ensure initial viewport starts at the top so header/controls are visible on first paint.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  // Load history when conversationId is available, socket is connected, and user is authenticated
  useEffect(() => {
    if (conversationId && socket && isConnected && user) {
      console.log('📚 Loading history for conversation:', conversationId);
      setIsLoadingHistory(true);
      const timeoutId = setTimeout(() => {
        console.error('⏰ History load timeout after 5s - clearing loading state');
        setIsLoadingHistory(false);
      }, 5000); // 5 second timeout

      socket.emit('load_history', { conversationId });
      
      // Also listen for error to clear loading
      const handleError = (errData: { message: string }) => {
        console.error('❌ History load error:', errData.message);
        setIsLoadingHistory(false);
        clearTimeout(timeoutId);
      };
      
      socket.once('error', handleError);

      // Cleanup timeout on unmount or if loading completes
      return () => {
        clearTimeout(timeoutId);
        socket.off('error', handleError);
      };
    }
  }, [conversationId, socket, isConnected, user]);

  // Handle history loaded event
  useEffect(() => {
    if (!socket) return;

    const handleHistoryLoaded = (data: HistoryLoadedPayload) => {
      console.log('📚 History loaded:', data.messages.length, 'messages');

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
      setIsLoadingHistory(false);
      // Ensure conversationId is set
      setConversationId(data.conversationId);
      localStorage.setItem('chatConversationId', data.conversationId);
    };

    socket.on('history_loaded', handleHistoryLoaded);

    return () => {
      socket.off('history_loaded', handleHistoryLoaded);
    };
  }, [socket]);

  // Handle conversation created event from server
  useEffect(() => {
    if (!socket) return;

    const handleConversationCreated = (data: { conversationId: string; userId: string }) => {
      console.log('🆕 Conversation created:', data.conversationId);
      setConversationId(data.conversationId);
      localStorage.setItem('chatConversationId', data.conversationId);
    };

    socket.on('conversation_created', handleConversationCreated);

    return () => {
      socket.off('conversation_created', handleConversationCreated);
    };
  }, [socket]);

  // Fetch personas from API - use full backend URL
  useEffect(() => {
    const fetchPersonasWithRetry = async (retries = 3) => {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      
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
          return; // Success, exit the retry loop
          
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
          
          // If this is the last attempt, fall back to mock data
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
          } else {
            // Wait before retrying (exponential backoff)
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            console.log(`⏳ RETRYING IN ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
    };
    
    fetchPersonasWithRetry();
  }, [socket]);

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
    setChatState(prev => ({ ...prev, selectedCountry: countryKey }));
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

  const handleSendMessage = async (message: string) => {
    if (!chatState.selectedCountry || !socket) {
      console.error('❌ Cannot send message: no country selected or socket not connected');
      return;
    }

    // If socket exists but is not connected, try a quick reconnect window
    if (!socket.connected) {
      console.log('🔄 Socket not connected, attempting quick reconnect before sending...');
      try {
        // Attempt to trigger context connect (if exposed)
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

    console.log('📤 SENDING MESSAGE:', { message, country: chatState.selectedCountry });

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
      country_key: chatState.selectedCountry
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    // Send to server with the base message ID
    socket?.emit('user_message', {
      message,
      selected_country_key: chatState.selectedCountry,
      client_ts: Date.now(),
      message_id: messageId, // Send base ID to server
      model: chatState.currentModel,
      conversationId: currentConversationId
    });
    
    console.log('📤 MESSAGE SENT with ID:', messageId);
  };

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

  return (
    <div className="flex flex-col gap-[var(--row-gap)] min-h-[100svh] h-[100vh] h-[100lvh]">
      {/* Header with glass design */}
      <div className="relative z-10 px-4 md:px-6 pl-safe-l pr-safe-r pt-4 md:pt-6 mt-0">
        <div className="max-w-7xl mx-auto flex flex-col gap-[var(--row-gap)]">
          <GlassCard variant="light" size="md" hover className="py-3">
            <div className="flex items-center justify-between flex-wrap gap-3 xs:flex-nowrap">
              {/* Title Section */}
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  🇪🇸 AI Chat con Sabor Local
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-white/80"
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
          </GlassCard>

          {/* Controls Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--row-gap)]">
            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard variant="light" size="md" hover className="min-h-12 p-3">
                <SearchBar 
                  onSearch={handleSearch} 
                  onConversationSelect={handleSearch} 
                />
              </GlassCard>
            </motion.div>

            {/* Model Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard variant="blue" size="md" hover className="min-h-12 p-3">
                <ModelSelector 
                  currentModel={chatState.currentModel || 'gpt-4o-mini'} 
                  onModelChange={handleModelChange}
                  conversationId={conversationId || undefined}
                />
              </GlassCard>
            </motion.div>

            {/* Country Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard variant="emerald" size="md" hover className="min-h-12 p-3">
                <CountrySelector
                  personas={chatState.personas}
                  selectedCountry={chatState.selectedCountry}
                  onCountrySelect={handleCountrySelect}
                />
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className={cn(
        hasMessages ? "flex-1 overflow-y-auto px-4 md:px-6 pl-safe-l pr-safe-r pb-4" : "px-4 md:px-6 pl-safe-l pr-safe-r pb-2"
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

          {/* Welcome message */}
          <AnimatePresence>
            {chatState.messages.length === 0 && !isLoadingHistory && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-4 md:py-6"
              >
                <GlassCard variant="light" size="lg" gradient className="max-w-2xl mx-auto">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="text-7xl mb-4"
                  >
                    🌎
                  </motion.div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                    ¡Bienvenido!
                  </h2>
                  <p className="text-lg md:text-xl text-white/80 mb-4">
                    Selecciona un país arriba y comienza a chatear con IA que habla el español local.
                  </p>
                  <div className="text-white/60">
                    Cada país tiene su propio estilo de hablar, ¡descúbrelo!
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <AnimatePresence>
            <div className="flex flex-col">
              {chatState.messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                />
              ))}
            </div>
          </AnimatePresence>

          {/* Typing Indicator */}
          <TypingIndicator
            isVisible={chatState.isTyping}
            countryName={selectedPersona?.displayName}
          />

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area with glass design */}
      <div className="relative z-10 p-6 pt-2 pl-safe-l pr-safe-r mt-[clamp(8px,1.5vh,16px)]">
        <div className="max-w-4xl mx-auto">
          <GlassCard variant="dark" size="md">
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={!chatState.isConnected || !chatState.selectedCountry}
              selectedCountry={chatState.selectedCountry}
            />
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
