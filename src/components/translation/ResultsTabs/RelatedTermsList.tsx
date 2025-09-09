"use client";

import { motion } from "framer-motion";
import { RelatedTermsListProps } from "./resultsTabs.types";

export default function RelatedTermsList({ terms, onTermClick }: RelatedTermsListProps) {
  if (!terms || terms.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No related terms found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Related Terms
      </h3>

      <div className="space-y-4">
        <p className="text-gray-600">
          Explore related words and phrases that might be helpful:
        </p>

        <motion.div
          className="flex flex-wrap gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {terms.map((term, index) => (
            <motion.button
              key={term}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: index * 0.05,
                type: "spring",
                stiffness: 200,
                damping: 10
              }}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTermClick(term)}
              className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={`Search for related term: ${term}`}
            >
              <span>{term}</span>
              <svg
                className="ml-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </motion.button>
          ))}
        </motion.div>

        {/* Usage tip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: terms.length * 0.05 + 0.3 }}
          className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-purple-800 mb-1">
                Discover More
              </h4>
              <p className="text-sm text-purple-700">
                Click on any related term to explore its meaning and usage.
                This helps you build vocabulary connections and understand word relationships.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}