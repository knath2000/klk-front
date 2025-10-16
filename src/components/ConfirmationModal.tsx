"use client";

import React, { useEffect, useState } from 'react';

type ConfirmationModalProps = {
  open: boolean;
  title?: string;
  description?: string;
  loading?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
};

export default function ConfirmationModal({
  open,
  title = 'Confirm destructive action',
  description = 'This action cannot be undone. Type DELETE in the box below to confirm.',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const [input, setInput] = useState('');
  const [canConfirm, setCanConfirm] = useState(false);

  useEffect(() => {
    setCanConfirm(input === 'DELETE');
  }, [input]);

  useEffect(() => {
    if (!open) {
      setInput('');
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-2xl bg-[#0b0b0d] border border-gray-700 rounded-lg shadow-xl overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
          <p className="text-sm text-white/75 mb-4">{description}</p>

          <div className="mb-4">
            <label className="block text-xs font-medium text-white/80 mb-2">Type DELETE to confirm</label>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Type DELETE to confirm"
              aria-label="Type DELETE to confirm"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 rounded bg-white/6 text-white hover:bg-white/10 transition disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              onClick={async () => {
                try {
                  await onConfirm();
                } catch (e) {
                  // swallow; caller handles errors
                  console.error('ConfirmationModal onConfirm error', e);
                }
              }}
              disabled={!canConfirm || loading}
              className={`px-4 py-2 rounded font-semibold transition ${
                canConfirm && !loading
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-red-600/40 text-white/80 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                    <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Deleting...
                </span>
              ) : (
                'Delete permanently'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}