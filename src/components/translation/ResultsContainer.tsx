"use client";

import { useState } from 'react';
import { TranslationResult } from '@/lib/translationWebSocket';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Volume2, MessageSquare, Link, ChevronRight } from 'lucide-react';


interface ResultsContainerProps {
  query: string;
  streamingResult: string;
  onStreamingUpdate: (result: string) => void;
  result?: TranslationResult | null;
}

const tabs = [
  { id: 'definitions', label: 'Definitions', icon: BookOpen },
  { id: 'examples', label: 'Examples', icon: MessageSquare },
  { id: 'conjugations', label: 'Conjugations', icon: ChevronRight },
  { id: 'audio', label: 'Audio', icon: Volume2 },
  { id: 'related', label: 'Related', icon: Link },
];

export function ResultsContainer({ query, streamingResult, onStreamingUpdate, result }: ResultsContainerProps) {
  const [activeTab, setActiveTab] = useState('definitions');

  const renderTabContent = () => {
    if (streamingResult && !result) {
      return (
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Translating &ldquo;{query}&rdquo;...
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {streamingResult}
          </p>
        </div>
      );
    }

    if (!result) return <div>No results available</div>;

    switch (activeTab) {
      case 'definitions':
        return (
          <div className="space-y-4">
            {result.definitions && result.definitions.length > 0 ? (
              result.definitions.map((def, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {def.text || def.meaning || 'No definition'}
                      </h3>
                      {(def.partOfSpeech || def.pos) && (
                        <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full mb-3">
                          {def.partOfSpeech || def.pos}
                        </span>
                      )}
                      {def.examples && def.examples.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Examples:
                          </h4>
                          {def.examples.map((example, exIndex) => (
                            <p key={exIndex} className="text-gray-600 dark:text-gray-400 italic">
                              &ldquo;{example}&rdquo;
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <p>No definitions available</p>
            )}
          </div>
        );

      case 'examples':
        return (
          <div className="space-y-4">
            {result.examples && result.examples.length > 0 ? (
              result.examples.map((example, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
                >
                  <div className="space-y-3">
                    <p className="text-lg text-gray-900 dark:text-white font-medium">
                      {example.text || example.spanish || 'No example'}
                    </p>
                    {(example.translation || example.english) && (
                      <p className="text-gray-600 dark:text-gray-400">
                        &ldquo;{example.translation || example.english}&rdquo;
                      </p>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <p>No examples available</p>
            )}
          </div>
        );

      case 'conjugations':
        return (
          <div className="space-y-6">
            {result.conjugations ? (
              Object.entries(result.conjugations).map(([tense, forms]) => (
                <motion.div
                  key={tense}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {tense}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {typeof forms === 'object' && forms !== null && Object.entries(forms as Record<string, string>).map(([pronoun, form]) => (
                      <div key={pronoun} className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400 capitalize">
                          {pronoun}:
                        </span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {String(form)}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))
            ) : (
              <p>No conjugations available</p>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="space-y-4">
            {result.audio ? (
              Array.isArray(result.audio) ? (
                result.audio.map((audio, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <button className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors">
                        <Volume2 className="h-6 w-6" />
                      </button>
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">
                          Listen to pronunciation
                        </p>
                        {audio.pronunciation && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {audio.pronunciation}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                result.audio.ipa && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <button className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors">
                        <Volume2 className="h-6 w-6" />
                      </button>
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">
                          Pronunciation
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {result.audio.ipa}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )
              )
            ) : (
              <p>No audio available</p>
            )}
          </div>
        );

      case 'related':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.related ? (
              Array.isArray(result.related) ? (
                result.related.map((related, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 dark:text-white font-medium">
                        {related.word}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {related.type}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <>
                  {result.related.synonyms && result.related.synonyms.length > 0 && (
                    <div className="col-span-full">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Synonyms:</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.related.synonyms.map((syn, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                            {syn}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.related.antonyms && result.related.antonyms.length > 0 && (
                    <div className="col-span-full">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Antonyms:</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.related.antonyms.map((ant, index) => (
                          <span key={index} className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded">
                            {ant}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )
            ) : (
              <p>No related words available</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden"
    >
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}