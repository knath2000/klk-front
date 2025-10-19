'use client';

// New EmptyChatState component: centered greeting + input hero
import React from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import ChatInputSection from '@/components/chat/ChatInputSection';
import { useAuth } from '@/context/AuthContext';
import { useConversationUI } from '@/context/ConversationUIContext';
import clsx from 'clsx';

export default function EmptyChatState() {
  const ui = useConversationUI();
  const { selectedCountry } = ui;
  const { user } = useAuth();

  // Don't render hero input if we're bootstrapping a conversation
  if (ui.isBootstrappingConversation) {
    return null;
  }

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
        {`Hey, ${user?.name || 'there'}. Ready to dive in?`}
      </h1>

      <div className="w-full max-w-2xl">
        {/* Presentation-only scaffold: the actual interactive input is the unified footer input.
            Clicking this scaffold focuses the global footer input so we avoid duplicate inputs. */}
        {ui.selectedCountry ? (
          <div className="mx-auto w-full">
            <ChatInputSection
              conversationId={null}
              onSend={() => {
                /* placeholder */
              }}
              disabled={false}
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
          Send your first message above. The footer input will appear after you start the conversation.
        </div>
      </div>
    </div>
  );
}