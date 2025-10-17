'use client';

import { ReactNode, useState } from 'react';
import ChatShell from '@/components/ChatShell';
import ChatView from '@/components/ChatView';

export default function Home() {
  const [footerSlot, setFooterSlot] = useState<ReactNode | null>(null);

  return (
    <div className="min-h-screen">
      {/* Main chat interface (sidebar for authenticated users) */}
      <ChatShell footerSlot={footerSlot}>
        <ChatView onFooterChange={setFooterSlot} />
      </ChatShell>
    </div>
  );
}
