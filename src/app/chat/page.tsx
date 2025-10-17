'use client';
import { ReactNode, useState } from 'react';
import ChatShell from '@/components/ChatShell';
import ChatView from '@/components/ChatView';

export default function ChatPage() {
  const [footerSlot, setFooterSlot] = useState<ReactNode | null>(null);

  return (
    <div className="min-h-screen">
      {/* Background gradient — do not extend beneath the left sidebar on larger screens */}
      <div className="fixed top-0 bottom-0 left-0 right-0 -z-20 md:left-60 md:right-0 lg:left-64 lg:right-0 xl:left-72 xl:right-0">
        {/* Chat-specific gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 opacity-80" />
 
        {/* Additional floating orbs for chat */}
        <div
          className="absolute top-40 right-40 w-64 h-64 bg-blue-400/15 rounded-full blur-3xl animate-glass-pulse"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute bottom-40 left-40 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl animate-glass-float"
          style={{ animationDelay: '3s' }}
        />
      </div>

      {/* Main chat interface (sidebar for authenticated users) */}
      <ChatShell footerSlot={footerSlot}>
        <ChatView onFooterChange={setFooterSlot} />
      </ChatShell>
    </div>
  );
}