import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ChatSidebarOverlay from '@/components/ChatSidebarOverlay'
import { Inter } from 'next/font/google'
import AuthProvider from '@/context/AuthProvider'
import WebSocketProvider from '@/context/WebSocketProvider'
import StackAuthBridge from '@/components/StackAuthBridge'
import ConversationsProvider from '@/context/ConversationsContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Chat con Sabor Local',
  description: 'Chat with AI that speaks local Spanish slang',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://klk-back.onrender.com" crossOrigin="" />
      </head>
      <body className={inter.className}>
        <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-x-hidden" style={{ height: '100dvh' }}>
          {/* Container with only bottom padding - no horizontal padding */}
          <div className="pb-[calc(env(safe-area-inset-bottom)+24px)]">
            <AuthProvider>
              <WebSocketProvider>
                <StackAuthBridge>
                  <ConversationsProvider>
                    {/* Global ChatGPT-style sidebar overlay trigger + panel */}
                    <ChatSidebarOverlay />
                    {children}
                  </ConversationsProvider>
                </StackAuthBridge>
              </WebSocketProvider>
            </AuthProvider>
          </div>
        </div>
      </body>
    </html>
  )
}