import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import StackAuthBridge from '@/components/StackAuthBridge' // Changed to default import

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
        <div className="min-h-[100svh] h-[100vh] h-[100lvh] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-x-hidden">
          {/* Safe-area aware container */}
          <div className="px-[clamp(16px,4vw,20px)] pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+24px)]">
            <StackAuthBridge>
              {children}
            </StackAuthBridge>
          </div>
        </div>
      </body>
    </html>
  )
}
