"use client";

import { motion } from 'framer-motion';

export function LoadingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden"
    >
      {/* Tab Navigation Skeleton */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-6 space-y-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
          >
            <div className="space-y-4">
              {/* Title skeleton */}
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mt-2" />
                <div className="flex-1 space-y-2">
                  <div className="w-3/4 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="w-1/4 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>

              {/* Content skeleton */}
              <div className="space-y-2 ml-5">
                <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="w-5/6 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="w-4/6 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>

              {/* Examples skeleton */}
              <div className="space-y-2 ml-5">
                <div className="w-1/3 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="w-4/5 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Streaming indicator */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span>Translating...</span>
        </div>
      </div>
    </motion.div>
  );
}