"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut, isLoading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed left-4 right-4 z-20 isolate pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
    >
      <GlassCard 
        variant="light" 
        size="sm" 
        hover 
        className={cn(
          "px-6 py-2 transition-colors",
          // When scrolled, increase opacity to avoid visual clash with underlying hero card
          scrolled
            ? "bg-slate-900/60 border-white/15 backdrop-blur-md shadow-lg"
            : ""
        )}
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
            <div className={cn(
              "flex rounded-xl p-1",
              scrolled ? "bg-white/10 backdrop-blur-md" : "bg-white/5 backdrop-blur-sm"
            )}>
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

            {/* Auth Section */}
            <div className="flex items-center space-x-2">
              {isLoading ? (
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-white/20 border-t-white/60"></div>
              ) : user ? (
                /* User Menu */
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-medium hidden sm:block">
                      {user.name || user.email}
                    </span>
                  </motion.button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                    >
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSignOut();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              ) : (
                /* Sign In/Up Buttons */
                <div className="flex items-center space-x-2">
                  <Link
                    href="/auth/signin"
                    className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

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

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </motion.div>
  );
}