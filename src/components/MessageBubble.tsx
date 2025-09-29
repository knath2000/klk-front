'use client';

import { motion } from 'framer-motion';
import { Message } from '@/types/chat';
import clsx from 'clsx';

interface MessageBubbleProps {
  message: Message;
  // Remove unused isLast parameter
  // isLast: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.type === 'user';
  const isAssistant = message.type === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
        type: "spring",
        stiffness: 100
      }}
      className={clsx(
        "flex mb-4 w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={clsx(
          "max-w-[80%] px-4 py-3 rounded-2xl shadow-sm",
          isUser
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-md"
        )}
      >
        {/* Message Content */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {/* Message Type Label */}
        {isUser && (
          <div className="text-xs text-blue-100 mb-1 font-semibold">
            Tú
          </div>
        )}

        {isAssistant && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold">
            Assistant
          </div>
        )}

        {/* Streaming Indicator */}
        {isAssistant && message.isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1 mt-2"
          >
            <div className="flex gap-1">
              <motion.div
                className="w-1 h-1 bg-blue-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-1 h-1 bg-blue-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-1 h-1 bg-blue-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
              />
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">
              escribiendo...
            </span>
          </motion.div>
        )}

        {/* Timestamp */}
        <div
          className={clsx(
            "text-xs mt-2 opacity-70",
            isUser ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>

        {/* Country indicator for user messages */}
        {isUser && message.country_key && (
          <div className="text-xs text-blue-100 mt-1 opacity-80">
            🇲🇽 {message.country_key.toUpperCase()}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;