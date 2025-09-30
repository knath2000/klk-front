"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User, Menu, X } from "lucide-react";
import { createPortal } from "react-dom";

export default function Navigation() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut, isLoading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
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

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

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

          {/* Navigation Links - Segmented control on mobile, tabs on desktop */}
          <div className="flex-1 flex justify-center">
            {isMobile ? (
              // Mobile: Segmented control spanning full width
              <div className="flex w-full max-w-xs bg-white/10 backdrop-blur-sm rounded-xl p-1">
                <Link
                  href="/"
                  className={cn(
                    "flex-1 px-4 py-2 rounded-lg text-center text-sm font-medium transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-blue-400/50",
                    pathname === "/"
                      ? "bg-blue-500/80 text-white shadow-lg shadow-blue-500/25"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  )}
                >
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center space-x-2"
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
                    "flex-1 px-4 py-2 rounded-lg text-center text-sm font-medium transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-blue-400/50",
                    pathname === "/translate"
                      ? "bg-emerald-500/80 text-white shadow-lg shadow-emerald-500/25"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  )}
                >
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    <span>Translate</span>
                  </motion.span>
                </Link>
              </div>
            ) : (
              // Desktop: Original tab layout
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
              </div>
            )}
          </div>

          {/* Auth Section - Hamburger on mobile */}
          <div className="flex items-center space-x-2">
            {isMobile ? (
              // Mobile: Hamburger menu for auth and features
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowHamburgerMenu(!showHamburgerMenu)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/90"
              >
                <Menu className="w-5 h-5" />
              </motion.button>
            ) : (
              // Desktop: Direct auth and features
              <>
                {isLoading ? (
                  <div className="w-8 h-8 animate-spin rounded-full border-2 border-white/20 border-t-white/60"></div>
                ) : user ? (
                  /* User Menu */
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      ref={triggerRef}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium hidden sm:block">
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
                            className="fixed z-[10000] w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 pointer-events-auto"
                            style={{ top: menuPos.top, left: menuPos.left }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
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
                                // Prevent overlay from catching the click before this runs
                                handleSignOut();
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
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
              </>
            )}

            {/* Status Indicator - Move to end for mobile */}
            <div className="flex items-center space-x-2">
              {isLoading ? (
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-white/20 border-t-white/60"></div>
              ) : (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50"
                />
              )}
            </div>
          </div>

          {/* Mobile Hamburger Menu */}
          {isMobile && showHamburgerMenu && typeof document !== "undefined" &&
            createPortal(
              <>
                {/* Overlay */}
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setShowHamburgerMenu(false)}
                  aria-hidden="true"
                />
                {/* Menu Panel */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="fixed right-4 top-[calc(env(safe-area-inset-top,0px)+6rem)] z-[9999] w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {isLoading ? (
                    <div className="px-4 py-2 text-center text-gray-500">Loading...</div>
                  ) : user ? (
                    <>
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
                          setShowHamburgerMenu(false);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/signin"
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setShowHamburgerMenu(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/auth/signup"
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setShowHamburgerMenu(false)}
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                  <Link
                    href="/enterprise"
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                    onClick={() => setShowHamburgerMenu(false)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>T3 Features</span>
                  </Link>
                </motion.div>
              </>,
              document.body
            )
          }
        </div>
      </GlassCard>
    </motion.div>
  );
}