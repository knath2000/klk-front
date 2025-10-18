import React from 'react';
import ChatInputSection from './ChatInputSection';

export type ChatInputBubbleProps = {
  conversationId?: string | null;
  disabled?: boolean;
  selectedCountry?: string | null;
  onSend?: (msg: string) => void;
  className?: string;
  autoFocus?: boolean;
};

export default function ChatInputBubble({
  conversationId = null,
  disabled = false,
  selectedCountry = null,
  onSend,
  className = '',
  autoFocus = false,
}: ChatInputBubbleProps) {
  return (
    <div
      className={`${className} mx-auto w-full rounded-full px-4 py-3 bg-gray-800/60 dark:bg-gray-800 shadow-lg ring-1 ring-black/20`}
      role="region"
      aria-label="Chat input"
    >
      <ChatInputSection
        conversationId={conversationId ?? null}
        onSend={onSend}
        disabled={disabled}
        selectedCountry={selectedCountry ?? null}
      />
    </div>
  );
}