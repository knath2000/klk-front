import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import Navigation from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Chat con Sabor Local | Español Regional",
  description: "Conversa con IA que habla español como la gente del lugar. Selecciona un país y descubre el slang y expresiones locales auténticas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full overflow-x-hidden`}
      >
        {/* Dynamic background gradients */}
        <div className="fixed inset-0 bg-isolation">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800" />
          
          {/* Animated floating orbs */}
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-glass-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-glass-float" />
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-glass-pulse" 
            style={{ animationDelay: '1s' }} 
          />
          
          {/* Subtle texture overlay */}
          <div className="absolute inset-0 opacity-[0.02] bg-gradient-to-r from-white via-transparent to-white" />
        </div>

        {/* Main application content */}
        <div className="relative z-10 min-h-full stack">
          <WebSocketProvider>
            <AuthProvider>
              {/* Floating glass navigation */}
              <Navigation />
              
              {/* Main content with tighter responsive top spacing for fixed nav */}
              <main style={{ paddingTop: 'clamp(40px, 5vh, 64px)' }}>
                {children}
              </main>
            </AuthProvider>
          </WebSocketProvider>
        </div>

        {/* Global glass effects overlay */}
        <div className="fixed inset-0 pointer-events-none z-0">
          {/* Subtle vignette effect */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/10" />
        </div>
      </body>
    </html>
  );
}
