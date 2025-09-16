"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Volume2, MessageSquare, Link, ChevronRight } from 'lucide-react';

interface TranslationResult {
  definitions?: Array<{
    text: string;
    partOfSpeech?: string;
    examples?: string[];
  }>;
  examples?: Array<{
    text: string;
    translation?: string;
  }>;
  conjugations?: Array<{
    tense: string;
    forms: Record<string, string>;
  }>;
  audio?: Array<{
    url: string;
    pronunciation?: string;
  }>;
  related?: Array<{
    word: string;
    type: string;
  }>;
}

interface ResultsContainerProps {
  query: string;
  streamingResult: string;
  onStreamingUpdate: (result: string) => void;
}

const tabs = [
  { id: 'definitions', label: 'Definitions', icon: BookOpen },
  { id: 'examples', label: 'Examples', icon: MessageSquare },
  { id: 'conjugations', label: 'Conjugations', icon: ChevronRight },
  { id: 'audio', label: 'Audio', icon: Volume2 },
  { id: 'related', label: 'Related', icon: Link },
];

export function ResultsContainer({ query, streamingResult, onStreamingUpdate }: ResultsContainerProps) {
  const [activeTab, setActiveTab] = useState('definitions');
  const [result, setResult] = useState<TranslationResult | null>(null);

  // Mock result for demonstration - in real implementation, this would come from WebSocket
  useEffect(() => {
    if (query && !result) {
      // Simulate API response
      setTimeout(() => {
        setResult({
          definitions: [
            {
              text: "hola",
              partOfSpeech: "interjection",
              examples: ["¡Hola! ¿Cómo estás?", "Hola, me llamo Juan."]
            },
            {
              text: "hello",
              partOfSpeech: "noun",
              examples: ["un saludo cordial"]
            }
          ],
          examples: [
            {
              text: "¡Hola! ¿Cómo estás?",
              translation: "Hello! How are you?"
            },
            {
              text: "Hola, me llamo Juan.",
              translation: "Hello, my name is Juan."
            }
          ],
          conjugations: [
            {
              tense: "Present",
              forms: {
                "yo": "saludo",
                "tú": "saludas",
                "él/ella": "saluda",
                "nosotros": "saludamos",
                "vosotros": "saludáis",
                "ellos/ellas": "saludan"
              }
            }
          ],
          audio: [
            {
              url: "/audio/hola.mp3",
              pronunciation: "/ˈola/"
            }
          ],
          related: [
            { word: "adiós", type: "antonym" },
            { word: "saludar", type: "related" },
            { word: "buenos días", type: "synonym" }
          ]
        });
      }, 1000);
    }
  }, [query, result]);

  const renderTabContent = () => {
    if (!result) return null;

    switch (activeTab) {
      case 'definitions':
        return (
          <div className="space-y-4">
            {result.definitions?.map((def, index) => (
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
                      {def.text}
                    </h3>
                    {def.partOfSpeech && (
                      <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full mb-3">
                        {def.partOfSpeech}
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
            ))}
          </div>
        );

      case 'examples':
        return (
          <div className="space-y-4">
            {result.examples?.map((example, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
              >
                <div className="space-y-3">
                  <p className="text-lg text-gray-900 dark:text-white font-medium">
                    {example.text}
                  </p>
                  {example.translation && (
                    <p className="text-gray-600 dark:text-gray-400">
                      &ldquo;{example.translation}&rdquo;
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        );

      case 'conjugations':
        return (
          <div className="space-y-6">
            {result.conjugations?.map((conj, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {conj.tense}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(conj.forms).map(([pronoun, form]) => (
                    <div key={pronoun} className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 capitalize">
                        {pronoun}:
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {form}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        );

      case 'audio':
        return (
          <div className="space-y-4">
            {result.audio?.map((audio, index) => (
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
            ))}
          </div>
        );

      case 'related':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.related?.map((related, index) => (
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
            ))}
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