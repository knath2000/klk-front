import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ChatSidebarOverlay from '@/components/ChatSidebarOverlay'
import { AuthProvider } from '@/context/AuthContext'
import { WebSocketProvider } from '@/context/WebSocketContext'
import StackAuthBridge from '@/components/StackAuthBridge'
import { TranslationProvider } from '@/context/TranslationContext'
import { ConversationsRootProvider } from '@/context/ConversationsRootProvider'

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
                <TranslationProvider>
                  <StackAuthBridge>
                    <ConversationsRootProvider>
                      {/* Global ChatGPT-style sidebar overlay trigger + panel */}
                      <ChatSidebarOverlay />
                      {children}
                    </ConversationsRootProvider>
                  </StackAuthBridge>
                </TranslationProvider>
              </WebSocketProvider>
            </AuthProvider>
          </div>
        </div>
      </body>
    </html>
  )
}