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

  // Initialize WebSocket connection
  useEffect(() => {
    // Fetch personas from API
    fetch('/api/personas')
      .then(res => res.json())
      .then(data => {
        setChatState(prev => ({ ...prev, personas: data.personas }));
      });

    // Connect to real WebSocket server
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001');
    
    socketRef.current = socket;
    
    socket.on('connect', () => {
      setChatState(prev => ({ ...prev, isConnected: true }));
    });
    
    socket.on('disconnect', () => {
      setChatState(prev => ({ ...prev, isConnected: false }));
    });
    
    socket.on('assistant_delta', (data) => {
      // Handle streaming responses
      updateAssistantMessage(data.message_id, data.chunk, false);
    });
    
    socket.on('assistant_final', (data) => {
      // Handle final response
      updateAssistantMessage(data.message_id, data.final_content, true);
    });
    
    return () => {
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