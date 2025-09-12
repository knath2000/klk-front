'use client';

import { useState, useEffect } from 'react';
import ChatView from '@/components/ChatView';
import Hero from '@/components/Hero/Hero';
import Link from 'next/link';
import { Persona } from '@/types/chat';
import { fallbackPersonas } from '@/lib/personas';


export default function Home() {
  const [personas, setPersonas] = useState<Persona[]>(fallbackPersonas);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    // In a real app, fetch personas from API here
    setPersonas(fallbackPersonas);
  }, []);

  const handleStartChat = () => {
    if (selectedCountry) {
      setShowChat(true);
    }
  };

  const handleQuickTranslate = () => {
    // Navigate to translate mode or open demo
    console.log('Quick translate clicked');
  };

  // TODO: Wire handleCountrySelect to Hero country selection
  // TODO: Wire handleCountrySelect to Hero country selection
const handleCountrySelect = (countryKey: string) => {
    setSelectedCountry(countryKey);
  };

  if (showChat) {
    return (
      <main role="main" className="min-h-screen flex flex-col">
        <ChatView
          initialCountry={selectedCountry}
          initialPersonas={personas}
        />
        
        {/* Features Link */}
        <div className="fixed top-4 right-4 z-50">
          <Link
            href="/features"
            className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 text-sm font-medium"
            aria-label="Explore T3 Features"
          >
            <span className="mr-2" aria-hidden="true">🚀</span>
            T3 Features
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main role="main" className="min-h-screen flex flex-col">
      <Hero
        personas={personas}
        onStartChat={handleStartChat}
        onQuickTranslate={handleQuickTranslate}
        selectedCountry={selectedCountry}
        onCountrySelect={handleCountrySelect}
      />
      
      {/* Features Link - positioned below hero on mobile */}
      <div className="fixed bottom-4 right-4 z-50 sm:top-4 sm:right-4">
        <Link
          href="/features"
          className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 text-sm font-medium"
          aria-label="Explore T3 Features"
        >
          <span className="mr-2" aria-hidden="true">🚀</span>
          T3 Features
        </Link>
      </div>
    </main>
  );
}
