'use client';

// New EmptyChatState component: centered greeting + input hero
import React from 'react';
import ChatInput from '@/components/ChatInput';
import { useAuth } from '@/context/AuthContext';
import clsx from 'clsx';

export default function EmptyChatState(): React.ReactElement {
  const { user } = useAuth();
  const rawName = (user && (user.name || user.email)) ?? 'there';
  const firstName = String(rawName).split(' ')[0];

  const focusFooterInput = () => {
    // Try to focus the bottom input (ChatInput lives in the footer)
    const footerInput = document.querySelector('footer input[type="text"]') as HTMLInputElement | null;
    if (footerInput) {
      footerInput.focus();
      // place caret at end
      const val = footerInput.value || '';
      footerInput.setSelectionRange(val.length, val.length);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 select-none">
      <h1
        className={clsx(
          'text-center',
          'text-4xl md:text-5xl lg:text-6xl',
          'font-light',
          'text-white/90',
          'mb-8'
        )}
      >
        {`Hey, ${firstName}. Ready to dive in?`}
      </h1>

      <div className="w-full max-w-2xl">
        {/* Visual hero input - clicking focuses the real footer input */}
        <div
          role="button"
          tabIndex={0}
          onClick={focusFooterInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              focusFooterInput();
            }
          }}
          className={clsx(
            'mx-auto',
            'flex items-center gap-4',
            'w-full',
            'rounded-full',
            'px-4 py-3',
            'bg-gray-800/60 dark:bg-gray-800',
            'shadow-lg',
            'ring-1 ring-black/20',
            'cursor-text',
            'transition-shadow',
            'hover:shadow-xl'
          )}
        >
          <div className="flex items-center justify-center w-10 h-10 text-gray-300">
            <span className="text-xl font-medium">+</span>
          </div>

          <div className="flex-1">
            <div className="text-left text-gray-300 text-lg">Ask anything</div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Voice input"
              className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center shadow-md"
              onClick={(e) => {
                // prevent outer focus handler from stealing click
                e.stopPropagation();
                focusFooterInput();
              }}
            >
              {/* Microphone SVG (simple) */}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 11v1a7 7 0 0 1-14 0v-1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19v3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-400">
          Click the bar above or use the input below to start a conversation.
        </div>
      </div>
    </div>
  );
}