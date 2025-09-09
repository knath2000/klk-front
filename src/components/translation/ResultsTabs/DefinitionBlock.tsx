"use client";

import { motion } from "framer-motion";
import { DefinitionBlockProps } from "./resultsTabs.types";

export default function DefinitionBlock({ definitions, query }: DefinitionBlockProps) {
  if (!definitions || definitions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No definitions found for &quot;{query}&quot;</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Definitions for &quot;{query}&quot;
      </h3>

      <div className="space-y-4">
        {definitions.map((definition, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">{index + 1}</span>
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <p className="text-gray-900 font-medium">{definition.text}</p>
                  {definition.partOfSpeech && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {definition.partOfSpeech}
                    </span>
                  )}
                </div>

                {definition.examples && definition.examples.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Examples:</h4>
                    <ul className="space-y-1">
                      {definition.examples.map((example, exampleIndex) => (
                        <motion.li
                          key={exampleIndex}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: (index * 0.1) + (exampleIndex * 0.05) }}
                          className="text-sm text-gray-600 italic pl-4 border-l-2 border-gray-200"
                        >
                          &quot;{example}&quot;
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}

                {definition.synonyms && definition.synonyms.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Synonyms:</h4>
                    <div className="flex flex-wrap gap-2">
                      {definition.synonyms.map((synonym, synonymIndex) => (
                        <motion.span
                          key={synonymIndex}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (index * 0.1) + (synonymIndex * 0.03) }}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer transition-colors"
                        >
                          {synonym}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}