import React from 'react';
import Link from 'next/link';
import { Zap, User, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type Props = {
  isCollapsed?: boolean;
};

export default function SidebarFooter({ isCollapsed = false }: Props) {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <footer className={`p-4 border-t border-gray-700 ${isCollapsed ? 'px-2' : ''}`}>
      {user ? (
        <>
          <div className={`mb-3 ${isCollapsed ? 'flex justify-center' : ''}`}>
            <Link
              href="/enterprise"
              className={`flex items-center gap-2 text-sm text-white/90 hover:text-white bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded px-3 py-2 transition-all duration-200 ${
                isCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full'
              }`}
            >
              <Zap className="w-4 h-4" />
              {!isCollapsed && <span>Upgrade your plan</span>}
            </Link>
          </div>

          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed ? (
              <div className="flex-1">
                <p className="text-sm font-medium text-white/90">{user.name || 'User'}</p>
                <p className="text-xs text-white/60">Free</p>
              </div>
            ) : null}

            <div className={isCollapsed ? 'ml-0' : 'ml-2'}>
              <button
                onClick={handleSignOut}
                className={`flex items-center gap-2 text-sm text-white/90 hover:text-white hover:bg-white/10 rounded px-3 py-2 transition-all duration-200 ${
                  isCollapsed ? 'w-10 h-10 justify-center p-0' : ''
                }`}
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
                {!isCollapsed && <span>Sign Out</span>}
              </button>
            </div>
          </div>
        </>
      ) : (
        <Link
          href="/enterprise"
          className={`flex items-center gap-2 text-sm text-white/90 hover:text-white bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded px-3 py-2 transition-all duration-200 ${
            isCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full'
          }`}
        >
          <Zap className="w-4 h-4" />
          {!isCollapsed && <span>Upgrade your plan</span>}
        </Link>
      )}
    </footer>
  );
}