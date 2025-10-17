'use client';

import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import CountrySelector from '@/components/CountrySelector';
import ModelSelector from '@/components/ModelSelector';
import type { Persona } from '@/types/chat';
import { showToast } from '@/components/Toast';

export type ChatHeaderProps = {
  activeConversation: {
    id?: string;
    title?: string | null;
    updated_at?: string | Date;
    persona_id?: string | null;
  } | null;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
};

/**
 * ChatHeader - lightweight header for chat page
 * Extracted to its own file to support incremental decomposition.
 */
export default function ChatHeader({
  activeConversation,
  sidebarOpen,
  toggleSidebar,
}: ChatHeaderProps) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [localSelectedCountry, setLocalSelectedCountry] = useState<string | null>(activeConversation?.persona_id ?? null);
  const [currentModel, setCurrentModel] = useState<string>('google/gemma-3-27b-it');

  // Sync localSelectedCountry when activeConversation changes
  useEffect(() => {
    setLocalSelectedCountry(activeConversation?.persona_id ?? null);
  }, [activeConversation?.persona_id]);

  // Load personas from backend manifest
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const backend = process.env.NEXT_PUBLIC_BACKEND_URL || '';
        const res = await fetch(`${backend}/api/personas`);
        if (!res.ok) throw new Error('Failed fetching personas');
        const json = await res.json();
        if (mounted && Array.isArray(json.personas)) {
          setPersonas(json.personas);
        }
      } catch (err) {
        // silent: persona list is non-essential for baseline UI
        console.warn('Failed to fetch personas for header', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleCountrySelect = async (countryKey: string) => {
    setLocalSelectedCountry(countryKey);
    // If we have an active conversation, persist selection
    if (activeConversation?.id) {
      try {
        const backend = process.env.NEXT_PUBLIC_BACKEND_URL || '';
        const url = `${backend}/api/conversations/${activeConversation.id}`;
        await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ persona_id: countryKey }),
        });
        showToast('Persona updated', 'success');
      } catch (err) {
        console.error('Failed to persist persona selection', err);
        showToast('Failed to save persona selection', 'error');
      }
    } else {
      showToast('Persona selected (will apply after creating a conversation)', 'info');
    }
  };

  return (
    <header className={clsx('flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700')}>
      <div className="flex items-center gap-3">
        <button
          aria-label="Toggle sidebar"
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {/* simple hamburger icon - keep lightweight */}
          <span className="sr-only">Toggle sidebar</span>
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <rect y="0" width="18" height="2" rx="1" fill="currentColor" />
            <rect y="5" width="18" height="2" rx="1" fill="currentColor" />
            <rect y="10" width="18" height="2" rx="1" fill="currentColor" />
          </svg>
        </button>

        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {activeConversation?.title ?? 'Chat'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {activeConversation?.updated_at
              ? `Updated ${String(activeConversation.updated_at)}`
              : 'No conversations yet'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Horizontal toolbar: Country selector (personas) + Model selector */}
        <div className="hidden sm:block">
          <CountrySelector
            personas={personas}
            selectedCountry={localSelectedCountry}
            onCountrySelect={handleCountrySelect}
          />
        </div>

        <div className="hidden sm:block">
          <ModelSelector
            currentModel={currentModel}
            onModelChange={(m) => setCurrentModel(m)}
            conversationId={activeConversation?.id ?? undefined}
          />
        </div>
      </div>
    </header>
  );
}