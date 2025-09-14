'use client';

import { motion } from 'framer-motion';
import { useState, KeyboardEvent } from 'react';
import { ChatInputProps } from '@/types/chat';
import clsx from 'clsx';

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  selectedCountry
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled && selectedCountry) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = message.trim() && !disabled && selectedCountry;

  return (
    <div className="flex items-end gap-3 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      {/* Input Field */}
      <div className="flex-1 relative">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            selectedCountry
              ? "Escribe tu mensaje..."
              : "Selecciona un país primero..."
          }
          disabled={disabled}
          className={clsx(
            "w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none",
            disabled && "opacity-50 cursor-not-allowed",
            !selectedCountry && "placeholder-red-400"
          )}
        />

        {/* Character count indicators */}
        {message.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-3 text-xs text-gray-400"
          >
            {message.length}
          </motion.div>
        )}
      </div>

      {/* Send Button */}
      <motion.button
        onClick={handleSend}
        disabled={!canSend}
        className={clsx(
          "px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2",
          canSend
            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
            : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
        )}
        whileHover={canSend ? { scale: 1.05 } : {}}
        whileTap={canSend ? { scale: 0.95 } : {}}
      >
        <motion.svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={canSend ? { x: [0, 2, 0] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </motion.svg>
        <span className="hidden sm:inline">Enviar</span>
      </motion.button>
    </div>
  );
};

export default ChatInput;