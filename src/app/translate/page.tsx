"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SearchBar from "@/components/translation/SearchBar/SearchBar";
import ResultsTabs from "@/components/translation/ResultsTabs/ResultsTabs";
import LoadingSkeleton from "@/components/translation/LoadingSkeleton";
import ErrorDisplay from "@/components/translation/ErrorDisplay";

interface TranslationResult {
  definitions: Array<{
    text: string;
    partOfSpeech?: string;
    examples?: string[];
  }>;
  examples: Array<{
    spanish: string;
    english: string;
  }>;
  conjugations?: {
    present: Record<string, string>;
    past: Record<string, string>;
    future?: Record<string, string>;
  };
  audio?: Array<{
    url: string;
    type: "pronunciation" | "example";
    text: string;
  }>;
  related: string[];
}

export default function TranslatePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<TranslationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Handle search submission
  const handleSearch = async (query: string, lang: string, context?: string) => {
    setSearchQuery(query);
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          language: lang,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during translation");
    } finally {
      setIsLoading(false);
    }
  };

  // Load suggestions on component mount
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const response = await fetch("/api/translate/supported-languages");
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.languages || []);
        }
      } catch (err) {
        console.error("Failed to load suggestions:", err);
      }
    };

    loadSuggestions();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Spanish Translation
          </h1>
          <p className="text-lg text-gray-600">
            Translate words and phrases with regional Spanish context
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <SearchBar
            onSubmit={handleSearch}
            suggestions={suggestions}
            isLoading={isLoading}
          />
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <LoadingSkeleton />
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <ErrorDisplay message={error} />
          </motion.div>
        )}

        {/* Results */}
        {results && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ResultsTabs
              results={results}
              query={searchQuery}
              onRelatedClick={handleSearch}
            />
          </motion.div>
        )}

        {/* Empty State */}
        {!results && !isLoading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center py-16"
          >
            <div className="max-w-md mx-auto">
              <svg
                className="mx-auto h-24 w-24 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v3m-6 8h2m-2 4h2m2-4h2m-2 4h2M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Start Translating
              </h3>
              <p className="text-gray-500">
                Enter a word or phrase above to get detailed translations with regional Spanish context.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}