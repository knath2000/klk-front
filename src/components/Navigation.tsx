"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User, ChevronLeft } from "lucide-react";
import { createPortal } from "react-dom";
import { useConversations } from "@/context/ConversationsContext";

export default function Navigation() {
  const isClient = typeof window !== 'undefined';
  if (!isClient) return null;

  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut, isLoading } = useAuth();
  const { toggleSidebar } = useConversations();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Reposition menu when opened or on viewport changes
  useEffect(() => {
    if (!showUserMenu) return;
    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // Align right edge of 12rem (w-48) panel to trigger's right, with 8px gap
      const width = 192; // 48 * 4
      setMenuPos({
        top: Math.max(0, r.bottom + 8),
        left: Math.max(8, Math.round(r.right - width)),
      });
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, [showUserMenu]);

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
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.5rem)" }}
    >
      <GlassCard 
        variant="light" 
        size="sm" 
        hover 
        className={cn(
          "px-4 py-1.5 transition-colors", // Slim height
          scrolled
            ? "bg-[#343541]/80 border-gray-200/20 backdrop-blur-sm shadow-md"
            : "bg-[#343541]/60 border-gray-200/10 backdrop-blur-sm"
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo Section - Top-left brand with collapse icon */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center space-x-2"
          >
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-6 h-6 rounded bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">AC</span>
              </div>
              <span className="text-lg font-bold text-gray-200 group-hover:text-blue-200 transition-colors duration-200">
                AI Chat Español
              </span>
            </Link>
            <motion.button
              onClick={toggleSidebar}
              className="ml-2 p-1 rounded bg-gray-200/10 hover:bg-gray-200/20 text-gray-200"
              aria-label="Toggle sidebar"
              aria-controls="sidebar"
              aria-expanded={false}
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
          </motion.div>

          {/* Right-aligned Get Plus button */}
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-200/20 border-t-gray-200"></div>
            ) : user ? (
              /* User Menu */
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  ref={triggerRef}
                  className="flex items-center space-x-2 px-2 py-1.5 rounded bg-gray-200/10 hover:bg-gray-200/20 text-gray-200 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                    <User className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="text-sm font-medium hidden md:block">
                    {user.name || user.email}
                  </span>
                </motion.button>

                {/* User Dropdown Menu (Portalized) */}
                {showUserMenu && typeof document !== "undefined" &&
                  createPortal(
                    <>
                      {/* Overlay below panel, above page */}
                      <div
                        className="fixed inset-0 z-[9999]"
                        onClick={() => setShowUserMenu(false)}
                        aria-hidden="true"
                      />
                      {/* Panel */}
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="fixed z-[10000] w-48 bg-[#343541] dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200/20 dark:border-gray-700 py-1 pointer-events-auto"
                        style={{ top: menuPos.top, left: menuPos.left }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-4 py-2 border-b border-gray-200/20 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-200">
                            {user.name || 'User'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {user.email}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Prevent overlay from catching the click before this runs
                            handleSignOut();
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-200/10 dark:hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </motion.div>
                    </>,
                    document.body
                  )
                }
              </div>
            ) : (
              /* Sign In/Up Buttons - Simplified for minimal bar */
              <Link
                href="/auth/signin"
                className="px-3 py-1.5 text-sm font-medium text-gray-200 hover:text-white hover:bg-gray-200/10 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              >
                Sign In
              </Link>
            )}

            {/* Get Plus Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/enterprise"
                className={cn(
                  "flex items-center space-x-2 px-3 py-1.5 rounded",
                  "bg-gradient-to-r from-purple-500/20 to-pink-500/20",
                  "border border-purple-400/30 text-gray-200 hover:text-white",
                  "hover:from-purple-500/30 hover:to-pink-500/30",
                  "transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                )}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-medium">Get Plus</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}