"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui";
import { cn, glassAnimations } from "@/lib/utils";

export default function Navigation() {
  const pathname = usePathname();

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 left-4 right-4 z-20"
    >
      <GlassCard 
        variant="light" 
        size="sm" 
        hover 
        className="px-6 py-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo Section */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center space-x-2"
          >
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">AC</span>
              </div>
              <span className="text-xl font-bold text-white group-hover:text-blue-200 transition-colors duration-200">
                AI Chat Español
              </span>
            </Link>
          </motion.div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-2">
            <div className="flex bg-white/5 rounded-xl p-1 backdrop-blur-sm">
              <Link
                href="/"
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-blue-400/50",
                  pathname === "/"
                    ? "bg-blue-500/80 text-white shadow-lg shadow-blue-500/25"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                )}
              >
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Chat</span>
                </motion.span>
              </Link>
              
              <Link
                href="/translate"
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-blue-400/50",
                  pathname === "/translate"
                    ? "bg-emerald-500/80 text-white shadow-lg shadow-emerald-500/25"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                )}
              >
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  <span>Translate</span>
                </motion.span>
              </Link>
            </div>

            {/* Feature Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/enterprise"
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-lg",
                  "bg-gradient-to-r from-purple-500/20 to-pink-500/20",
                  "border border-purple-400/30 text-white/90 hover:text-white",
                  "hover:from-purple-500/30 hover:to-pink-500/30",
                  "transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                )}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-medium">T3 Features</span>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50"
          />
        </div>
      </GlassCard>
    </motion.div>
  );
}