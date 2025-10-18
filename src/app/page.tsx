'use client';

import { ReactNode, useState } from 'react';
import ChatShell from '@/components/ChatShell';
import ChatView from '@/components/ChatView';

export default function Home() {
  // Footer/input rendering is handled by ChatViewContainer; no footerSlot needed.
  return (
    <div className="min-h-screen">
      {/* Main chat interface (sidebar for authenticated users) */}
      <ChatShell>
        <ChatView />
      </ChatShell>
    </div>
  );
}
