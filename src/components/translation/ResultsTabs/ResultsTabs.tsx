"use client";

import { useState, useMemo } from "react";
import { Tab } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { ResultsTabsProps, TabData } from "./resultsTabs.types";
import DefinitionBlock from "./DefinitionBlock";
import ExampleList from "./ExampleList";
import ConjugationTable from "./ConjugationTable";
import AudioPlayer from "./AudioPlayer";
import RelatedTermsList from "./RelatedTermsList";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

// TODO: Implement favorites functionality for translation results
export default function ResultsTabs({ 
  results, 
  query, 
  onRelatedClick, 
  isLoading = false 
}: ResultsTabsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Define available tabs based on data
  const tabs: TabData[] = useMemo(() => {
    const availableTabs = [];

    if (results.definitions?.length > 0) {
      availableTabs.push({ 
        id: "definitions", 
        label: "Definiciones", 
        count: results.definitions.length,
        isAvailable: true 
      });
    }
    if (results.examples?.length > 0) {
      availableTabs.push({ 
        id: "examples", 
        label: "Ejemplos", 
        count: results.examples.length,
        isAvailable: true 
      });
    }
    if (results.conjugations) {
      availableTabs.push({ 
        id: "conjugations", 
        label: "Conjugaciones", 
        isAvailable: true 
      });
    }
    if (results.audio && results.audio.length > 0) {
      availableTabs.push({
        id: "audio",
        label: "Audio",
        count: results.audio.length,
        isAvailable: true
      });
    }    if (results.related?.length > 0) {
      availableTabs.push({ 
        id: "related", 
        label: "Relacionados", 
        count: results.related.length,
        isAvailable: true 
      });
    }

    return availableTabs;
  }, [results]);

  const handleRelatedClick = (term: string) => {
    onRelatedClick(term, "es");
  };

  const handleAudioPlay = (audioUrl: string) => {
    // Handle audio playback - could integrate with a global audio context
    console.log("Playing audio:", audioUrl);
  };

  if (tabs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8"
      >
        <p className="text-gray-500">No translation results available yet.</p>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-0">
      <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
        <Tab.List className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 rounded-xl bg-blue-900/20 p-1">
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              className={({ selected }) =>
                classNames(
                  "w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200",
                  "ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                  selected
                    ? "bg-white text-blue-700 shadow"
                    : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
                )
              }
            >
              <motion.div
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center space-x-2"
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-blue-100 bg-blue-600 rounded-full"
                  >
                    {tab.count}
                  </motion.span>
                )}
              </motion.div>
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="mt-6">
          <AnimatePresence mode="wait">
            {tabs.map((tab) => (
              <Tab.Panel
                key={tab.id}
                className="rounded-xl bg-white p-4 sm:p-6 shadow-lg"
                static
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {isLoading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading {tab.label}...</p>
                    </motion.div>
                  ) : (
                    <>
                      {tab.id === "definitions" && (
                        <DefinitionBlock definitions={results.definitions} query={query} />
                      )}
                      {tab.id === "examples" && (
                        <ExampleList examples={results.examples} onAudioPlay={handleAudioPlay} />
                      )}
                      {tab.id === "conjugations" && results.conjugations && (
                        <ConjugationTable conjugations={results.conjugations} word={query} />
                      )}
                      {tab.id === "audio" && results.audio && (
                        <AudioPlayer
                          audioItems={results.audio}
                          onPlay={handleAudioPlay}
                        />
                      )}
                      {tab.id === "related" && (
                        <RelatedTermsList terms={results.related} onTermClick={handleRelatedClick} />
                      )}
                    </>
                  )}
                </motion.div>
              </Tab.Panel>
            ))}
          </AnimatePresence>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
