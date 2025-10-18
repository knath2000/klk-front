'use client';
import { ReactNode, useState } from 'react';
import { useConversationUI } from '@/context/ConversationUIContext';
import ChatShell from '@/components/ChatShell';
import ChatView from '@/components/ChatView';

export default function ChatPage() {
  // ChatShell and ChatView handle footer/input rendering internally now.
  return (
    <div className="min-h-screen">
      {/* Background gradient removed — relying on layout margins so sidebar occludes background */}

      {/* Main chat interface (sidebar for authenticated users) */}
      <ChatShell>
        <ChatView />
      </ChatShell>
    </div>
  );
}