'use client';

import { LazyMotion, domAnimation, m } from 'framer-motion';
import useAnimationsReady from '@/hooks/useAnimationsReady';
import { TypingIndicatorProps } from '@/types/chat';

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isVisible, countryName }) => {
  if (!isVisible) return null;

  const animationsReady = useAnimationsReady();
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Non-animated fallback for first paint or reduced-motion users
  if (!animationsReady || reduceMotion) {
    return (
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex-shrink-0 flex items-center justify-center">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
              {countryName ? `${countryName} está escribiendo...` : 'escribiendo...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex-shrink-0 flex items-center justify-center">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[0, 0.2, 0.4].map((delay, i) => (
                <m.div
                  key={i}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay,
                    ease: 'easeInOut'
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
              {countryName ? `${countryName} está escribiendo...` : 'escribiendo...'}
            </span>
          </div>
        </div>
      </div>
    </LazyMotion>
  );
};

export default TypingIndicator;