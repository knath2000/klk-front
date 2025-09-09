"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { SearchBarProps, SearchSuggestion, SearchState } from "./searchBar.types";
import SearchSuggestions from "./SearchSuggestions";

export default function SearchBar({ onSubmit, suggestions, isLoading }: SearchBarProps) {
  const [searchState, setSearchState] = useState<SearchState>({
    query: "",
    language: "es",
    context: "",
    isValid: true,
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [localSuggestions, setLocalSuggestions] = useState<SearchSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced autocomplete
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setLocalSuggestions([]);
      return;
    }

    try {
      // Query supported languages endpoint for suggestions
      const response = await fetch(`/api/translate/supported-languages?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        const suggestionItems: SearchSuggestion[] = data.suggestions?.map((item: string) => ({
          text: item,
          type: "autocomplete" as const,
        })) || [];
        setLocalSuggestions(suggestionItems);
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setLocalSuggestions([]);
    }
  }, []);

  // Debounce input changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(searchState.query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchState.query, fetchSuggestions]);

  // Validation
  const validateQuery = (query: string): boolean => {
    if (!query.trim()) {
      setSearchState(prev => ({ ...prev, isValid: false, errorMessage: "Please enter a word or phrase to translate" }));
      return false;
    }
    if (query.length > 100) {
      setSearchState(prev => ({ ...prev, isValid: false, errorMessage: "Query too long (max 100 characters)" }));
      return false;
    }
    setSearchState(prev => ({ ...prev, isValid: true, errorMessage: undefined }));
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchState(prev => ({ ...prev, query: value }));
    setShowSuggestions(true);
    setSelectedSuggestionIndex(-1);
    validateQuery(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateQuery(searchState.query)) return;

    onSubmit(searchState.query, searchState.language, searchState.context);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setSearchState(prev => ({ ...prev, query: suggestion }));
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    validateQuery(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || localSuggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev < localSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionSelect(localSuggestions[selectedSuggestionIndex].text);
        } else {
          handleSubmit(e);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    if (searchState.query.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 150);
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <motion.input
            ref={inputRef}
            type="text"
            value={searchState.query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Enter a word or phrase to translate..."
            className={`w-full px-4 py-3 pr-12 text-lg border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
              searchState.isValid
                ? "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                : "border-red-300 focus:border-red-500 focus:ring-red-200"
            }`}
            aria-label="Translation search"
            aria-describedby={searchState.errorMessage ? "search-error" : undefined}
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
            role="combobox"
            aria-autocomplete="list"
          />

          <motion.button
            type="submit"
            disabled={!searchState.isValid || isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-md transition-colors duration-200 ${
              searchState.isValid && !isLoading
                ? "text-blue-600 hover:bg-blue-50"
                : "text-gray-400 cursor-not-allowed"
            }`}
            aria-label="Search"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"
              />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </motion.button>
        </div>

        {!searchState.isValid && searchState.errorMessage && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-600"
            id="search-error"
            role="alert"
          >
            {searchState.errorMessage}
          </motion.p>
        )}
      </form>

      <SearchSuggestions
        suggestions={localSuggestions}
        onSelect={handleSuggestionSelect}
        isVisible={showSuggestions}
        selectedIndex={selectedSuggestionIndex}
      />
    </div>
  );
}