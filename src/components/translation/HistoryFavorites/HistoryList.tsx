"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TranslationHistoryItem {
  id: string;
  query: string;
  language: string;
  timestamp: Date;
  result?: string;
}

interface HistoryListProps {
  history: TranslationHistoryItem[];
  onItemClick: (query: string) => void;
  onClearHistory: () => void;
  isLoading?: boolean;
}

export default function HistoryList({
  history,
  onItemClick,
  onClearHistory,
  isLoading = false
}: HistoryListProps) {
  const [showAll, setShowAll] = useState(false);
  const displayItems = showAll ? history : history.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm">No translation history yet</p>
        <p className="text-xs text-gray-400 mt-1">Your searches will appear here</p>
      </div>
    );
  }

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Recent Searches</h3>
        {history.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showAll ? "Show less" : `Show all (${history.length})`}
          </button>
        )}
        {history.length > 0 && (
          <motion.button
            onClick={onClearHistory}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-sm text-red-600 hover:text-red-800 transition-colors ml-4"
          >
            Clear all
          </motion.button>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        <div className="space-y-2">
          {displayItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onItemClick(item.query)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.query}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500 uppercase">
                      {item.language}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {history.length > 5 && !showAll && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowAll(true)}
          className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          View {history.length - 5} more items
        </motion.button>
      )}
    </div>
  );
}