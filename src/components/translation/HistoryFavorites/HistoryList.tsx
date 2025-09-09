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
    <div className="space-y-4 bg-white rounded-xl shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between border-b pb-4 mb-4">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Recent Searches</h3>
        </div>
        {history.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1"
          >
            <span>{showAll ? "Show less" : `Show all (${history.length})`}</span>
            <svg className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
        {history.length > 0 && (
          <motion.button
            onClick={onClearHistory}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-sm text-red-600 hover:text-red-800 transition-colors flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Clear all</span>
          </motion.button>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        <div className="space-y-3">
          {displayItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group"
              onClick={() => onItemClick(item.query)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {item.query}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                      {item.language}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <motion.svg
                    whileHover={{ x: 2 }}
                    className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </motion.svg>
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
          className="w-full py-3 text-sm text-blue-600 hover:text-blue-800 transition-colors border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100"
        >
          <div className="flex items-center justify-center space-x-2">
            <span>View {history.length - 5} more items</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </motion.button>
      )}

      {history.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">No translation history yet</p>
          <p className="text-xs text-gray-400 mt-1">Your searches will appear here</p>
        </div>
      )}
    </div>
  );
}