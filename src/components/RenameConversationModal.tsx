import React, { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';

type Props = {
  open: boolean;
  conversationId: string | null;
  initialTitle?: string | null;
  onCancel: () => void;
  onConfirm: (conversationId: string, title: string) => Promise<boolean> | boolean;
  className?: string;
};

/**
 * RenameConversationModal - lightweight inline modal for renaming conversations.
 * - Renders absolutely (parent should be position:relative) and aligns near the source item.
 * - Keeps a simple, accessible input and actions.
 */
export default function RenameConversationModal({
  open,
  conversationId,
  initialTitle = '',
  onCancel,
  onConfirm,
  className = '',
}: Props) {
  const [title, setTitle] = useState<string>(initialTitle ?? '');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTitle(initialTitle ?? '');
  }, [initialTitle, open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    if (!conversationId) return;
    const trimmed = (title || '').trim();
    if (!trimmed) return;
    try {
      setLoading(true);
      const ok = await onConfirm(conversationId, trimmed);
      if (ok) {
        onCancel();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Rename conversation"
      className={`absolute z-60 right-2 top-1/2 transform -translate-y-1/2 bg-[#0b0c1a] border border-white/6 rounded-md shadow-lg w-64 p-3 ${className}`}
    >
      <label className="block text-xs text-white/70 mb-2">Conversation title</label>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              void submit();
            } else if (e.key === 'Escape') {
              onCancel();
            }
          }}
          className="flex-1 px-2 py-2 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4b90ff]"
          placeholder="Enter title"
        />
        <button
          onClick={() => onCancel()}
          aria-label="Cancel rename"
          className="p-2 rounded hover:bg-white/5 text-white/70"
          disabled={loading}
        >
          <X className="w-4 h-4" />
        </button>
        <button
          onClick={() => void submit()}
          aria-label="Confirm rename"
          className="p-2 rounded bg-[#4b90ff] hover:bg-[#4b90ff]/90 text-white flex items-center justify-center"
          disabled={loading}
        >
          <Check className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}