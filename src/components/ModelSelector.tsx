'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getNeonAuthToken } from '@/lib/neonAuth';

interface AIModel {
  id: string;
  name: string;
  display_name: string;
  description: string;
  inference_speed: 'fast' | 'medium' | 'slow';
  is_available: boolean;
}

export default function ModelSelector({ 
  currentModel, 
  onModelChange,
  conversationId
}: { 
  currentModel: string; 
  onModelChange: (modelId: string) => void;
  conversationId?: string;
}) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Mock models data - in real app, this would come from API
  useEffect(() => {
    const mockModels: AIModel[] = [
      // Default (cheapest, fast)
      {
        id: 'meta-llama/llama-3.2-3b-instruct',
        name: 'Llama 3.2 3B Instruct',
        display_name: 'Llama 3.2 3B (Default)',
        description: 'Default: fast, low cost. Good colloquial Spanish and slang for general chat.',
        inference_speed: 'fast',
        is_available: true,
      },
      // Mid-tier (better accuracy, moderate cost)
      {
        id: 'meta-llama/llama-3.3-8b-instruct:free',
        name: 'Llama 3.3 8B Instruct (Free)',
        display_name: 'Llama 3.3 8B (Mid)',
        description: 'Mid-tier: stronger idiom and regional nuance; slightly slower and pricier.',
        inference_speed: 'medium',
        is_available: true,
      },
      // Premium (highest accuracy, slowest)
      {
        id: 'meta-llama/llama-3.3-70b-instruct',
        name: 'Llama 3.3 70B Instruct',
        display_name: 'Llama 3.3 70B (Premium)',
        description: 'Premium: best colloquial fluency and nuance; slowest and highest cost.',
        inference_speed: 'slow',
        is_available: true,
      },
    ];
    setModels(mockModels);
  }, []);

  // Portal mount guard
  useEffect(() => {
    setMounted(true);
  }, []);

  // Body scroll lock when menu is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleModelChange = async (modelId: string) => {
    setIsLoading(true);
    try {
      // If the user hasn't started a conversation yet, apply locally and skip backend call
      if (!conversationId) {
        console.warn('Model switch: no conversationId yet; applying locally without backend persistence.');
        onModelChange(modelId);
        setIsOpen(false);
        // Optional UX hint: let the user know persistence happens after starting a chat
        // alert('Model updated locally. Start a conversation to persist this setting.');
        return;
      }

      // Resolve backend URL with safe production/dev fallbacks and absolute origin enforcement
      const isProduction = process.env.NODE_ENV === 'production';
      const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const fallbackProd = 'https://klk-back-production.up.railway.app'; // deployment status reference
      const fallbackDev = 'http://localhost:3001';

      // Normalize and validate absolute URL
      const normalizeBase = (u: string) => u.replace(/\/+$/, '');
      const isAbsoluteHttp = (u?: string) => !!u && /^https?:\/\//i.test(u);

      const base = isAbsoluteHttp(envUrl)
        ? normalizeBase(envUrl as string)
        : normalizeBase(isProduction ? fallbackProd : fallbackDev);

      const url = `${base}/api/models/${encodeURIComponent(modelId)}/switch`;

      console.log('[ModelSelector] Switching model via:', url, 'conversationId:', conversationId);

      // Get auth token for protected endpoint
      const token = await getNeonAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        // Persist with the real conversationId
        body: JSON.stringify({ conversationId }),
        credentials: 'include',
        mode: 'cors',
      });

      if (!response.ok) {
        // Attempt to parse JSON; if HTML (Next.js 404), also capture text snippet
        let serverMsg = '';
        let textSnippet = '';
        try {
          const ct = response.headers.get('Content-Type') || '';
          if (ct.includes('application/json')) {
            const err = await response.json();
            serverMsg = err?.error || '';
          } else {
            const txt = await response.text();
            textSnippet = txt.slice(0, 200);
          }
        } catch {
          // ignore parsing errors
        }
        throw new Error(
          `Failed to switch model: ${response.status} ${response.statusText}` +
          (serverMsg ? ` — ${serverMsg}` : '') +
          (textSnippet ? ` — BODY: ${textSnippet}` : '')
        );
      }

      const result = await response.json();
      console.log('Model switched successfully:', result);

      onModelChange(modelId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch model:', error);
      // If no token, proceed with local update but warn
      if (error instanceof Error && error.message.includes('Authentication')) {
        console.warn('No auth token; model updated locally only');
        onModelChange(modelId);
        setIsOpen(false);
      } else {
        alert('Failed to switch model. Please verify your backend URL (NEXT_PUBLIC_BACKEND_URL) points to the server and try again after starting a conversation.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentModel = () => {
    return models.find(model => model.id === currentModel) || models[0];
  };

  const getSpeedBadge = (speed: string) => {
    const speedClasses = {
      fast: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
      slow: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
    };
    return (
      speedClasses[speed as keyof typeof speedClasses] ||
      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    );
  };

  const listboxId = 'model-selector-listbox';

  // Portal-rendered dropdown content (safe-area aware, mobile friendly)
  const dropdownContent = isOpen ? (
    <>
      {/* Overlay below panel; safe-area notches are inherently respected by fixed positioning */}
      <div
        className="fixed inset-0 z-[9999] bg-black/0"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      <div
        className="fixed z-[10000] bg-white dark:bg-gray-900 dark:text-white rounded-md shadow-lg ring-1 ring-black/10 dark:ring-white/10 pointer-events-auto w-full max-w-md max-h-[80vh] overflow-y-auto"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 64px)',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
        role="listbox"
        id={listboxId}
        aria-label="Available Models"
      >
        <div className="py-1">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Available Models
          </div>
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => handleModelChange(model.id)}
              role="option"
              aria-selected={currentModel === model.id}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 flex items-start justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 ${
                currentModel === model.id
                  ? 'bg-indigo-50 border-l-4 border-indigo-500 dark:bg-indigo-500/10 dark:border-indigo-400'
                  : ''
              }`}
              disabled={!model.is_available || isLoading}
            >
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{model.display_name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">{model.description}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${getSpeedBadge(model.inference_speed)}`}>
                  {model.inference_speed}
                </span>
                {!model.is_available && (
                  <span className="text-xs text-red-500">Unavailable</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  ) : null;

  return (
    <div className="relative z-30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-3.5 w-full text-base bg-white border border-gray-300 text-gray-900 rounded-md hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700 dark:focus-visible:ring-blue-400 dark:focus-visible:border-blue-400" // Full-width, padding, font-size
        disabled={isLoading}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            Switching...
          </>
        ) : (
          <>
            <span className="text-xs">🤖</span>
            {getCurrentModel()?.display_name || 'Select Model'}
            <svg className="w-4 h-4 ml-1 text-gray-700 dark:text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* Portal dropdown */}
      {mounted && dropdownContent ? createPortal(dropdownContent, document.body) : null}
    </div>
  );
}