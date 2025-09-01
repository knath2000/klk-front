'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { TypingIndicatorProps } from '@/types/chat';

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isVisible, countryName }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex items-center gap-3 mb-4"
        >
          {/* Avatar placeholder */}
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex-shrink-0 flex items-center justify-center">
            <span className="text-white text-xs font-bold">AI</span>
          </div>

          {/* Typing bubble */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <motion.div
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: 0,
                    ease: "easeInOut"
                  }}
                />
                <motion.div
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: 0.2,
                    ease: "easeInOut"
                  }}
                />
                <motion.div
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: 0.4,
                    ease: "easeInOut"
                  }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                {countryName ? `${countryName} está escribiendo...` : 'escribiendo...'}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TypingIndicator;