'use client';

// New EmptyChatState component: centered greeting + input hero
import React from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import ChatInputSection from '@/components/chat/ChatInputSection';
import { useAuth } from '@/context/AuthContext';
import { useConversationUI } from '@/context/ConversationUIContext';
import clsx from 'clsx';

export default function EmptyChatState(): React.ReactElement {
  const { user } = useAuth();
  const ui = useConversationUI();
  const rawName = (user && (user.name || user.email)) ?? 'there';
  const firstName = String(rawName).split(' ')[0];

  const activateAndFocusFooter = () => {
    // Only focus the footer input — do not create a conversation on focus.
    setTimeout(() => {
      const footerInput = document.querySelector('footer input[type="text"]') as HTMLInputElement | null;
      if (footerInput) {
        footerInput.focus();
        const val = footerInput.value || '';
        footerInput.setSelectionRange(val.length, val.length);
      }
    }, 50);
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
        {/* If a country is selected, mount the real ChatInputSection so typing/send works.
            Otherwise show a non-interactive visual scaffold that prompts the user to select a country. */}
        {ui.selectedCountry ? (
          <div
            className={clsx(
              'mx-auto',
              'w-full',
              'rounded-full',
              'px-4 py-3',
              'bg-gray-800/60 dark:bg-gray-800',
              'shadow-lg',
              'ring-1 ring-black/20'
            )}
          >
            <ChatInputSection
              conversationId={ui.activeId}
              onSend={() => {
                /* no-op: ChatInputSection handles creation and send */
              }}
              disabled={!useWebSocket().isConnected || !ui.selectedCountry}
              selectedCountry={ui.selectedCountry ?? null}
            />
          </div>
        ) : (
          <div
            className={clsx(
              'mx-auto',
              'flex items-center gap-4',
              'w-full',
              'rounded-full',
              'px-4 py-3',
              'bg-gray-800/30 dark:bg-gray-800/40',
              'shadow-sm',
              'ring-1 ring-black/10',
              'cursor-not-allowed select-none'
            )}
            aria-hidden
          >
            <div className="flex items-center justify-center w-10 h-10 text-gray-400">
              <span className="text-xl font-medium opacity-70">+</span>
            </div>

            <div className="flex-1">
              <div className="text-left text-gray-400 text-lg opacity-80">Select a country to start</div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-700/40" />
            </div>
          </div>
        )}

        <div className="mt-4 text-center text-sm text-gray-400">
          Click the bar above or use the input below to start a conversation.
        </div>
      </div>
    </div>
  );
}