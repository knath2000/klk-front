import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import StackAuthBridge from '@/components/StackAuthBridge'
import { AuthProvider } from '@/context/AuthContext'
import { WebSocketProvider } from '@/context/WebSocketContext'
import { ConversationsProvider } from '@/context/ConversationsContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Chat con Sabor Local',
  description: 'Chat with AI that speaks local Spanish slang',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-x-hidden" style={{ height: '100dvh' }}>
          {/* Container with only bottom padding - no horizontal padding */}
          <div className="pb-[calc(env(safe-area-inset-bottom)+24px)]">
            <AuthProvider>
              <WebSocketProvider>
                <StackAuthBridge>
                  <ConversationsProvider>
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