'use client';
import { ReactNode, useState } from 'react';
import { useConversationUI } from '@/context/ConversationUIContext';
import ChatShell from '@/components/ChatShell';
import ChatView from '@/components/ChatView';

export default function ChatPage() {
  const { isSidebarCollapsed } = useConversationUI();
  const [footerSlot, setFooterSlot] = useState<ReactNode | null>(null);

  return (
    <div className="min-h-screen">
      {/* Background gradient removed — relying on layout margins so sidebar occludes background */}

      {/* Main chat interface (sidebar for authenticated users) */}
      <ChatShell footerSlot={footerSlot}>
        <ChatView onFooterChange={setFooterSlot} />
      </ChatShell>
    </div>
  );
}