'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Persona } from '@/types/chat';
// fallbackPersonas not used in current Hero logic (used in children)
import SlangOfTheDay from './SlangOfTheDay';
import OnboardingModal from './OnboardingModal';

interface HeroProps {
  personas: Persona[];
  onStartChat: () => void;
  onQuickTranslate: () => void;
  selectedCountry?: string | null;
  onCountrySelect?: (countryKey: string) => void;
}

const Hero: React.FC<HeroProps> = ({ personas, onStartChat, onQuickTranslate, selectedCountry, onCountrySelect }) => {
  const [showOnboarding, setShowOnboarding] = useState(!selectedCountry);

  const handleOnboardingComplete = (countryKey: string) => {
    onCountrySelect?.(countryKey);
    // This would typically set the selected country in parent state
    console.log('Selected country from onboarding:', countryKey);
    setShowOnboarding(false);
  };

  return (
    <div className="text-center py-12 px-4">
      {/* Animated Globe */}
      <motion.div
        initial={{ scale: 0.8, rotate: 0 }}
        animate={{ scale: 1, rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="mx-auto mb-8 w-32 h-32"
        aria-hidden="true"
      >
        <div className="relative w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 rounded-full shadow-lg">
          {/* Country flags as animated elements - simplified */}
          <motion.div
            className="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-6 bg-mexico rounded-sm"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ top: '10%', left: '50%' }}
          />
          <motion.div
            className="absolute bottom-2 left-1/4 w-6 h-4 bg-argentina rounded-sm"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
          <motion.div
            className="absolute bottom-4 right-1/4 w-6 h-4 bg-spain rounded-sm"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          />
        </div>
      </motion.div>

      {/* Bilingual Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-text via-mexico to-argentina bg-clip-text text-transparent"
        aria-describedby="hero-description"
      >
        ¡Chat with Local Flavor!
      </motion.h1>
      <motion.p
        id="hero-description"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed"
      >
        Chatea con IA que habla el español auténtico de cada país. Descubre el sabor local con slang, expresiones y el estilo único de cada región.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
      >
        <button
          onClick={onStartChat}
          className="btn-primary px-8 py-4 text-lg font-semibold w-full sm:w-auto"
          aria-label="Start chatting with local AI"
        >
          ¡Empezar a Chatear!
        </button>
        <button
          onClick={onQuickTranslate}
          className="btn-secondary px-8 py-4 text-lg font-semibold w-full sm:w-auto"
          aria-label="Try quick translation demo"
        >
          Probar Traducción Rápida
        </button>
      </motion.div>

      {/* Slang of the Day Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="card max-w-md mx-auto"
        role="complementary"
        aria-label="Slang of the day example"
      >
        <SlangOfTheDay personas={personas} />
      </motion.div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal 
          personas={personas}
          onComplete={handleOnboardingComplete}
          onDismiss={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
};

export default Hero;
