import React from 'react';
import Link from 'next/link';
import { Plus, Search, BookOpen, FolderPlus } from 'lucide-react';

type Props = {
  isCollapsed: boolean;
  onNewChat: () => Promise<void> | void;
  onToggleSearch: () => void;
};

export default function SidebarQuickActions({ isCollapsed, onNewChat, onToggleSearch }: Props) {
  const actions = [
    { id: 'new', icon: <Plus className="w-4 h-4" />, label: 'New chat', onClick: onNewChat },
    { id: 'search', icon: <Search className="w-4 h-4" />, label: 'Search chats', onClick: onToggleSearch },
    { id: 'library', icon: <BookOpen className="w-4 h-4" />, label: 'Library', onClick: () => { /* stub */ } },
    { id: 'projects', icon: <FolderPlus className="w-4 h-4" />, label: 'Projects', onClick: () => { /* stub */ } },
  ];

  return (
    <header className={`px-3 py-3 ${isCollapsed ? 'flex flex-col items-center gap-3' : 'space-y-3'}`}>
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <Link href="/" aria-label="Home" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            <span className="text-white font-bold text-xs">AC</span>
          </div>
          {!isCollapsed && <span className="text-lg font-bold text-gray-200">AI Chat Español</span>}
        </Link>
      </div>

      <nav aria-label="Quick actions" className={isCollapsed ? 'flex flex-col items-center gap-2' : 'flex flex-col gap-2'}>
        {actions.map(a => (
          <button
            key={a.id}
            onClick={() => a.onClick?.()}
            title={a.label}
            className={`
              flex items-center gap-3 rounded-md px-3 py-2 transition-colors
              text-white/90 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400/60
              ${isCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full justify-start'}
            `}
          >
            <span className={isCollapsed ? 'mx-auto' : ''}>{a.icon}</span>
            {!isCollapsed && <span className="text-sm font-medium">{a.label}</span>}
          </button>
        ))}
      </nav>
    </header>
  );
}