"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FavoriteItem {
  id: string;
  query: string;
  language: string;
  timestamp: Date;
  result?: string;
  tags?: string[];
}

interface FavoritesListProps {
  favorites: FavoriteItem[];
  onItemClick: (query: string) => void;
  onRemoveFavorite: (id: string) => void;
  isLoading?: boolean;
}

export default function FavoritesList({
  favorites,
  onItemClick,
  onRemoveFavorite,
  isLoading = false
}: FavoritesListProps) {
  const [showAll, setShowAll] = useState(false);
  const displayItems = showAll ? favorites : favorites.slice(0, 5);

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

  if (!favorites || favorites.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <p className="text-sm">No favorites yet</p>
        <p className="text-xs text-gray-400 mt-1">Star translations to save them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Favorites
        </h3>
        {favorites.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showAll ? "Show less" : `Show all (${favorites.length})`}
          </button>
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
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => onItemClick(item.query)}
                >
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.query}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500 uppercase">
                      {item.language}
                    </span>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex space-x-1">
                        {item.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{item.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => onItemClick(item.query)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    aria-label={`Search for: ${item.query}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <motion.button
                    onClick={() => onRemoveFavorite(item.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={`Remove ${item.query} from favorites`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {favorites.length > 5 && !showAll && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowAll(true)}
          className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          View {favorites.length - 5} more favorites
        </motion.button>
      )}

      {favorites.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
        >
          <p className="text-sm text-yellow-800">
            💡 <strong>Tip:</strong> Click the search icon to look up a favorite again,
            or hover and click the trash icon to remove it from favorites.
          </p>
        </motion.div>
      )}
    </div>
  );
}