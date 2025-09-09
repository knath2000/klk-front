"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SearchSuggestion } from "./searchBar.types";

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  onSelect: (suggestion: string) => void;
  isVisible: boolean;
  selectedIndex: number;
}

export default function SearchSuggestions({
  suggestions,
  onSelect,
  isVisible,
  selectedIndex,
}: SearchSuggestionsProps) {
  if (!isVisible || suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto"
      >
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={`${suggestion.type}-${suggestion.text}-${index}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(suggestion.text)}
            className={`w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
              index === selectedIndex ? "bg-blue-50 text-blue-700" : "text-gray-700"
            }`}
            role="option"
            aria-selected={index === selectedIndex}
          >
            <div className="flex items-center justify-between">
              <span className="truncate">{suggestion.text}</span>
              <div className="flex items-center space-x-2 ml-2">
                {suggestion.type === "history" && (
                  <span className="text-xs text-gray-400">Recent</span>
                )}
                {suggestion.type === "favorite" && (
                  <span className="text-xs text-yellow-500">★</span>
                )}
                {suggestion.count && suggestion.count > 1 && (
                  <span className="text-xs text-gray-400">({suggestion.count})</span>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}