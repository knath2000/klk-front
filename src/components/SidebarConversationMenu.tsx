import React from 'react';
import { Edit3, Trash2, X } from 'lucide-react';

type Props = {
  conversationId: string;
  onClose: () => void;
  onRename: (conversationId: string) => void;
  onDelete: (conversationId: string) => void;
  className?: string;
};

/**
 * SidebarConversationMenu - lightweight contextual menu for conversation items.
 * - Positioning is governed by the parent list item (should be position: relative).
 * - onRename / onDelete are callbacks provided by the sidebar.
 */
export default function SidebarConversationMenu({ conversationId, onClose, onRename, onDelete, className = '' }: Props) {
  return (
    <div
      role="dialog"
      aria-label="Conversation actions"
      className={`absolute right-2 top-1/2 z-50 transform -translate-y-1/2 bg-[#0b0c1a] border border-white/6 rounded-md shadow-lg w-44 ${className}`}
    >
      <div className="flex items-center justify-between px-2 py-1 border-b border-white/6">
        <div className="text-sm text-white/80">Actions</div>
        <button onClick={onClose} aria-label="Close menu" className="p-1 text-white/60 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col py-1">
        <button
          onClick={() => {
            onRename(conversationId);
            onClose();
          }}
          className="flex items-center gap-3 px-3 py-2 text-sm text-white/90 hover:bg-white/5 transition"
        >
          <Edit3 className="w-4 h-4 text-white/80" />
          Rename
        </button>

        <button
          onClick={() => {
            // confirm handled by caller (or caller can show modal)
            onDelete(conversationId);
            onClose();
          }}
          className="flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-white/5 hover:text-red-200 transition"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
}