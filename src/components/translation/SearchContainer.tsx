"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useDebounce } from 'use-debounce';
import { useTranslation } from '@/context/TranslationContext';
import { Search, Loader2, X } from 'lucide-react';

interface FormData {
  query: string;
}

interface SearchContainerProps {
  onQuerySubmit: (query: string) => void;
}

interface Suggestion {
  id: string;
  text: string;
  type: 'word' | 'phrase';
}

export function SearchContainer({ onQuerySubmit }: SearchContainerProps) {
  const { state } = useTranslation();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<FormData>({
    defaultValues: { query: '' },
    shouldUnregister: false, // Prevent field unregistration
  });

  const watchedQuery = watch('query', '');
  const [debouncedQuery] = useDebounce(watchedQuery, 300);

  // Add debugging for form state
  useEffect(() => {
    const formValue = getValues('query');
    console.log('📝 Form state debug - getValues("query"):', formValue, 'watch("query"):', watchedQuery);
  }, [watchedQuery, getValues]);

  // Local validity check for button state - with null safety
  const isValidInput = Boolean(watchedQuery && watchedQuery.trim().length > 0) && !state.isLoading;

  // Sync form state to local state for suggestions and reset loading if user is typing
  useEffect(() => {
    if (state.isLoading && (watchedQuery || '').trim()) {
      console.log('🔄 User typing detected, resetting loading state');
      // Note: We can't directly dispatch here, but this logs the issue
    }
  }, [watchedQuery, state.isLoading]);

  // Debug logging for button state - with null safety
  useEffect(() => {
    console.log('🔍 Button state - isLoading:', state.isLoading, 'watchedQuery:', JSON.stringify(watchedQuery), 'watchedQuery type:', typeof watchedQuery, 'isValidInput:', isValidInput, 'disabled:', !isValidInput);
  }, [state.isLoading, watchedQuery, isValidInput]);

  // Fetch suggestions based on debounced query
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length > 1) {
      fetchSuggestions(debouncedQuery);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedQuery]);

  const fetchSuggestions = async (query: string) => {
    try {
      // This would typically call your backend API for suggestions
      // For now, we'll use mock suggestions
      const mockSuggestions: Suggestion[] = [
        { id: '1', text: `${query} (noun)`, type: 'word' as const },
        { id: '2', text: `${query} (verb)`, type: 'word' as const },
        { id: '3', text: `¿Qué significa ${query}?`, type: 'phrase' as const },
        { id: '4', text: `Traducción de ${query}`, type: 'phrase' as const },
      ].filter(s => s.text.toLowerCase().includes(query.toLowerCase()));

      setSuggestions(mockSuggestions.slice(0, 5));
      setShowSuggestions(mockSuggestions.length > 0);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const onSubmit = (data: FormData) => {
    if (data.query.trim()) {
      onQuerySubmit(data.query.trim());
      setShowSuggestions(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault();
          setValue('query', suggestions[selectedIndex].text);
          setShowSuggestions(false);
          setSelectedIndex(-1);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setValue('query', suggestion.text);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const clearQuery = () => {
    setValue('query', '');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className="relative max-w-2xl mx-auto">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit(onSubmit)}
        className="relative"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            {...register('query', {
              required: 'Please enter a word or phrase to translate',
              minLength: {
                value: 1,
                message: 'Query must be at least 1 character'
              },
              maxLength: {
                value: 100,
                message: 'Query must be less than 100 characters'
              }
            })}
            ref={inputRef}
            type="text"
            placeholder="Enter Spanish word or phrase..."
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            disabled={state.isLoading}
            aria-label="Translation search input"
            aria-describedby={errors.query ? "query-error" : undefined}
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
            role="combobox"
            aria-autocomplete="list"
            className="w-full pl-12 pr-12 py-4 text-lg border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:border-blue-400 dark:focus:ring-blue-400/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          />

          {/* Clear button - moved to avoid overlap with submit button */}
          {watchedQuery && (
            <button
              type="button"
              onClick={clearQuery}
              className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 dark:hover:text-gray-300 transition-colors z-10"
              title="Clear input"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Loading indicator - positioned to not interfere */}
          {state.isLoading && (
            <div className="absolute right-16 top-1/2 transform -translate-y-1/2 z-10">
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            </div>
          )}
        </div>

        {errors.query && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-red-600 dark:text-red-400 text-sm"
          >
            {errors.query.message}
          </motion.p>
        )}

        {/* Submit Button - Enhanced with better state management */}
        <motion.button
          type="submit"
          disabled={!isValidInput}
          whileHover={{ scale: isValidInput ? 1.02 : 1 }}
          whileTap={{ scale: isValidInput ? 0.98 : 1 }}
          className={`w-full mt-4 font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
            isValidInput
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={isValidInput ? 'Submit translation' : 'Enter text to translate'}
        >
          {state.isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <Search className="h-5 w-5" />
              Translate
            </>
          )}
        </motion.button>
      </motion.form>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                  index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <span className="text-gray-900 dark:text-white">
                  {suggestion.text}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {suggestion.type}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}