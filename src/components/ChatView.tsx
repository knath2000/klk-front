'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import {
  Message,
  Persona,
  ChatState,
  UserMessageEvent,
  AssistantDeltaEvent,
  AssistantFinalEvent,
  TypingEvent
} from '@/types/chat';
import CountrySelector from './CountrySelector';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';
import clsx from 'clsx';

// Mock personas data (will be replaced with API call)
const mockPersonas: Persona[] = [
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
  }
];

const ChatView: React.FC = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    selectedCountry: null,
    isTyping: false,
    isConnected: false,
    personas: []
  });

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        console.error('   Please set NEXT_PUBLIC_BACKEND_URL to your actual Railway backend URL');
        setChatState(prev => ({ 
          ...prev, 
          personas: mockPersonas 
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
            console.log('🔄 ALL RETRIES EXHAUSTED - FALLING BACK TO MOCK PERSONAS');
            console.log('💡 TROUBLESHOOTING TIPS:');
            console.log('   1. Check if NEXT_PUBLIC_BACKEND_URL is set correctly in Vercel');
            console.log('   2. Verify the Railway backend is running and accessible');
            console.log('   3. Check browser console for CORS errors');
            console.log('   4. Try accessing the backend directly in a new tab');
            
            setChatState(prev => ({ 
              ...prev, 
              personas: mockPersonas 
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
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    
    console.log('🔌 WEBSOCKET CONFIGURATION:');
    console.log('   Backend URL:', backendUrl);
    
    // Validate backend URL for WebSocket
    if (!backendUrl || backendUrl.includes('your-railway-app')) {
      console.error('❌ INVALID BACKEND URL FOR WEBSOCKET:', backendUrl);
      console.error('   WebSocket connection will fail');
      return;
    }
    
    console.log('🔌 INITIALIZING WEBSOCKET CONNECTION...');
    const socket = io(backendUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    socketRef.current = socket;
    
    socket.on('connect', () => {
      console.log('✅ WEBSOCKET CONNECTED:', socket.id);
      setChatState(prev => ({ ...prev, isConnected: true }));
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ WEBSOCKET CONNECTION ERROR:', error);
      console.error('   This may indicate backend is unreachable or CORS issues');
      setChatState(prev => ({ ...prev, isConnected: false }));
    });
    
    socket.on('disconnect', (reason) => {
      console.log('🔌 WEBSOCKET DISCONNECTED:', reason);
      setChatState(prev => ({ ...prev, isConnected: false }));
    });
    
    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 WEBSOCKET RECONNECTED after', attemptNumber, 'attempts');
      setChatState(prev => ({ ...prev, isConnected: true }));
    });
    
    socket.on('reconnect_error', (error) => {
      console.error('❌ WEBSOCKET RECONNECT ERROR:', error);
    });
    
    socket.on('assistant_delta', (data) => {
      console.log('📨 RECEIVED assistant_delta:', data);
      updateAssistantMessage(data.message_id, data.chunk, false);
    });
    
    socket.on('assistant_final', (data) => {
      console.log('📨 RECEIVED assistant_final:', data);
      updateAssistantMessage(data.message_id, data.final_content, true);
    });
    
    socket.on('error', (error) => {
      console.error('💥 WEBSOCKET ERROR:', error);
    });
    
    return () => {
      console.log('🔌 CLEANING UP WEBSOCKET CONNECTION');
      socket.disconnect();
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.messages, chatState.isTyping]);

  const handleCountrySelect = (countryKey: string) => {
    setChatState(prev => ({ ...prev, selectedCountry: countryKey }));
  };

  const handleSendMessage = (message: string) => {
    if (!chatState.selectedCountry || !socketRef.current) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: Date.now(),
      country_key: chatState.selectedCountry
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    // Send to server
    const event: UserMessageEvent = {
      type: 'user_message',
      data: {
        message,
        selected_country_key: chatState.selectedCountry,
        client_ts: Date.now(),
        message_id: userMessage.id
      },
      timestamp: Date.now()
    };

    socketRef.current.emit('message', event);
  };

  const selectedPersona = chatState.personas.find(p => p.country_key === chatState.selectedCountry);

  // Helper function to update assistant messages from streaming
  const updateAssistantMessage = (messageId: string, content: string, isFinal: boolean) => {
    setChatState(prev => {
      const existingMessageIndex = prev.messages.findIndex(msg => msg.id === messageId);
      
      if (existingMessageIndex >= 0) {
        // Update existing message
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
        // Create new assistant message
        const newMessage: Message = {
          id: messageId,
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              🇪🇸 AI Chat con Sabor Local
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Conversa con IA que habla como la gente del lugar
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection status */}
            <div className="flex items-center gap-2">
              <div className={clsx(
                "w-2 h-2 rounded-full",
                chatState.isConnected ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {chatState.isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>

            <CountrySelector
              personas={chatState.personas}
              selectedCountry={chatState.selectedCountry}
              onCountrySelect={handleCountrySelect}
            />
          </div>
        </div>
      </motion.header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Welcome message */}
          <AnimatePresence>
            {chatState.messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <div className="text-6xl mb-4">🌎</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  ¡Bienvenido!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Selecciona un país arriba y comienza a chatear con IA que habla el español local.
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-500">
                  Cada país tiene su propio estilo de hablar, ¡descúbrelo!
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <AnimatePresence>
            {chatState.messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isLast={index === chatState.messages.length - 1}
              />
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          <TypingIndicator
            isVisible={chatState.isTyping}
            countryName={selectedPersona?.displayName}
          />

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={!chatState.isConnected || !chatState.selectedCountry}
        selectedCountry={chatState.selectedCountry}
      />
    </div>
  );
};

export default ChatView;

