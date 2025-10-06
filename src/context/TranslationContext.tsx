"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

// Add these interfaces before the useEffect
interface ParsedHistoryItem {
  query: string;
  language: string;
  timestamp: string;
  result?: string;
  context?: string;
}

interface ParsedFavoritesItem {
  query: string;
  language: string;
  timestamp: string;
  result?: string;
  tags?: string[];
}

// Types
export interface TranslationHistoryItem {
  id: string;
  query: string;
  language: string;
  timestamp: Date;
  result?: string;
  context?: string;
}

export interface FavoriteItem extends TranslationHistoryItem {
  tags?: string[];
}

export interface TranslationState {
  history: TranslationHistoryItem[];
  favorites: FavoriteItem[];
  isLoading: boolean;
  error: string | null;
  serviceStatus: {
    langdb: boolean;
    openrouter: boolean;
    overall: boolean;
  };
  authReady: boolean;
}

export type TranslationAction =
  | { type: 'ADD_TO_HISTORY'; payload: Omit<TranslationHistoryItem, 'id' | 'timestamp'> }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'ADD_TO_FAVORITES'; payload: Omit<FavoriteItem, 'id' | 'timestamp'> }
  | { type: 'REMOVE_FROM_FAVORITES'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_FROM_STORAGE'; payload: { history: TranslationHistoryItem[]; favorites: FavoriteItem[] } }
  | { type: 'UPDATE_SERVICE_STATUS'; payload: { langdb: boolean; openrouter: boolean; overall: boolean } }
  | { type: 'SET_AUTH_READY'; payload: boolean };

// Initial state
const initialState: TranslationState = {
  history: [],
  favorites: [],
  isLoading: false,
  error: null,
  serviceStatus: { langdb: true, openrouter: true, overall: true },
  authReady: false,
};

// Reducer
function translationReducer(state: TranslationState, action: TranslationAction): TranslationState {
  switch (action.type) {
    case 'ADD_TO_HISTORY': {
      const newItem: TranslationHistoryItem = {
        ...action.payload,
        id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };

      // Keep only the last 100 items
      const updatedHistory = [newItem, ...state.history].slice(0, 100);

      return {
        ...state,
        history: updatedHistory,
      };
    }

    case 'CLEAR_HISTORY':
      return {
        ...state,
        history: [],
      };

    case 'ADD_TO_FAVORITES': {
      const newItem: FavoriteItem = {
        ...action.payload,
        id: `favorite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };

      // Check if already exists
      const exists = state.favorites.some(fav => fav.query === newItem.query && fav.language === newItem.language);

      if (exists) {
        return state;
      }

      return {
        ...state,
        favorites: [newItem, ...state.favorites],
      };
    }

    case 'REMOVE_FROM_FAVORITES':
      return {
        ...state,
        favorites: state.favorites.filter(fav => fav.id !== action.payload),
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'LOAD_FROM_STORAGE':
      return {
        ...state,
        history: action.payload.history,
        favorites: action.payload.favorites,
      };

    case 'UPDATE_SERVICE_STATUS':
      return {
        ...state,
        serviceStatus: action.payload,
      };

    case 'SET_AUTH_READY':
      return {
        ...state,
        authReady: action.payload,
      };

    default:
      return state;
  }
}

// Context
const TranslationContext = createContext<{
  state: TranslationState;
  dispatch: React.Dispatch<TranslationAction>;
  addToHistory: (item: Omit<TranslationHistoryItem, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  addToFavorites: (item: Omit<FavoriteItem, 'id' | 'timestamp'>) => void;
  removeFromFavorites: (id: string) => void;
  isInFavorites: (query: string, language: string) => boolean;
  isReadyForTranslation: boolean;
} | null>(null);

// Provider component
export function TranslationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(translationReducer, initialState);
  const { user, isLoading: authLoading } = useAuth();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('translation-history');
      const storedFavorites = localStorage.getItem('translation-favorites');

      const history: TranslationHistoryItem[] = storedHistory
        ? JSON.parse(storedHistory).map((item: ParsedHistoryItem) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }))
        : [];

      const favorites: FavoriteItem[] = storedFavorites
        ? JSON.parse(storedFavorites).map((item: ParsedFavoritesItem) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }))
        : [];

      dispatch({ type: 'LOAD_FROM_STORAGE', payload: { history, favorites } });
    } catch (error) {
      console.error('Failed to load translation data from localStorage:', error);
    }
  }, []);

  // Set auth ready when auth loading completes
  useEffect(() => {
    if (!authLoading) {
      dispatch({ type: 'SET_AUTH_READY', payload: true });
    }
  }, [authLoading]);

  // Block translation requests until auth is ready
  const isReadyForTranslation = state.authReady;

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('translation-history', JSON.stringify(state.history));
      localStorage.setItem('translation-favorites', JSON.stringify(state.favorites));
    } catch (error) {
      console.error('Failed to save translation data to localStorage:', error);
    }
  }, [state.history, state.favorites]);

  // Fetch service status periodically
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/health`);
        const health = await response.json();
        if (health.serviceStatus) {
          const newStatus = health.serviceStatus;
          // Update service status in state
          dispatch({ type: 'UPDATE_SERVICE_STATUS', payload: newStatus });
        }
      } catch (error) {
        console.warn('Failed to fetch service status:', error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Helper functions
  const addToHistory = (item: Omit<TranslationHistoryItem, 'id' | 'timestamp'>) => {
    dispatch({ type: 'ADD_TO_HISTORY', payload: item });
  };

  const clearHistory = () => {
    dispatch({ type: 'CLEAR_HISTORY' });
  };

  const addToFavorites = (item: Omit<FavoriteItem, 'id' | 'timestamp'>) => {
    dispatch({ type: 'ADD_TO_FAVORITES', payload: item });
  };

  const removeFromFavorites = (id: string) => {
    dispatch({ type: 'REMOVE_FROM_FAVORITES', payload: id });
  };

  const isInFavorites = (query: string, language: string): boolean => {
    return state.favorites.some(fav => fav.query === query && fav.language === language);
  };

  return (
    <TranslationContext.Provider
      value={{
        state,
        dispatch,
        addToHistory,
        clearHistory,
        addToFavorites,
        removeFromFavorites,
        isInFavorites,
        isReadyForTranslation,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

// Hook to use the context
export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}