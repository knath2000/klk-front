"use client";

import { motion } from "framer-motion";
import { ExampleListProps } from "./resultsTabs.types";

export default function ExampleList({ examples, onAudioPlay }: ExampleListProps) {
  if (!examples || examples.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No examples found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Example Sentences
      </h3>

      <div className="space-y-4">
        {examples.map((example, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="space-y-3">
              {/* Spanish sentence */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">ES</span>
                </div>
                <div className="flex-1">
                  <p className="text-lg text-gray-900 leading-relaxed">
                    {example.spanish}
                  </p>
                  {example.audio && (
                    <motion.button
                      onClick={() => onAudioPlay?.(example.audio!)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                      aria-label={`Play audio for: ${example.spanish}`}
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      Listen to &quot;{example.spanish}&quot;
                    </motion.button>
                  )}
                </div>
              </div>

              {/* English translation */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">EN</span>
                </div>
                <div className="flex-1">
                  <p className="text-lg text-gray-700 leading-relaxed italic">
                    {example.english}
                  </p>
                </div>
              </div>
            </div>

            {/* Separator line */}
            {index < examples.length - 1 && (
              <div className="mt-4 pt-4 border-t border-gray-100" />
            )}
          </motion.div>
        ))}
      </div>

      {examples.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: examples.length * 0.1 + 0.2 }}
          className="mt-6 p-4 bg-blue-50 rounded-lg"
        >
          <p className="text-sm text-blue-700">
            💡 &lt;strong&gt;Tip:&lt;/strong&gt; Click the &quot;Listen&quot; button to hear native pronunciation for Spanish sentences.
          </p>
        </motion.div>
      )}
    </div>
  );
}