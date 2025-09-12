
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Persona } from '@/types/chat';
import CountrySelector from '../CountrySelector';
import { fallbackPersonas } from '@/lib/personas';

interface OnboardingModalProps {
  personas: Persona[];
  onComplete: (countryKey: string) => void;
  onDismiss: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ personas, onComplete, onDismiss }) => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const allPersonas = personas.length > 0 ? personas : fallbackPersonas;

  const handleSelect = (countryKey: string) => {
    setSelectedCountry(countryKey);
    onComplete(countryKey);
  };

  const handleSkip = () => {
    onDismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        aria-modal="true"
        role="dialog"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
      >
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0"
          onClick={onDismiss}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl">
            <motion.h2
              id="onboarding-title"
              className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              ¡Bienvenido!
            </motion.h2>
            <motion.p
              id="onboarding-description"
              className="text-gray-600 dark:text-gray-400"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Selecciona tu país para chatear con IA que habla el español local auténtico.
            </motion.p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Country Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Elige tu país
              </label>
              <CountrySelector
                personas={allPersonas.filter(p => p.safe_reviewed)}
                selectedCountry={selectedCountry}
                onCountrySelect={handleSelect}
                disabled={false}
              />
            </div>

            {/* Preview Section */}
            {selectedCountry && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
              >
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  ¡Vista previa!
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  En {allPersonas.find(p => p.country_key === selectedCountry)?.displayName || selectedCountry}:
                  "¡Hola, {allPersonas.find(p => p.country_key === selectedCountry)?.locale_hint || 'amigo'}! ¿Qué tal?"
                </p>
              </motion.div>
            )}

            {/* Quick Start Examples */}
            <div className="space-y-3 mb-6">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Ejemplos para empezar:</h4>
              <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div>&quot;¿Cómo se dice &#39;hello&#39; en slang mexicano?&quot;</div>
                <div>&quot;Traduce &#39;I love you&#39; al español argentino&quot;</div>
                <div>&quot;Cuéntame un chiste típico de España&quot;</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl bg-gray-50 dark:bg-gray-700/50 flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={handleSkip}
              className="btn-secondary flex-1 sm:flex-none"
              aria-label="Skip onboarding and continue without selecting country"
            >
              Saltar por ahora
            </button>
            <button
              onClick={() => selectedCountry && onComplete(selectedCountry)}
              disabled={!selectedCountry}
              className="btn-primary flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Complete onboarding with selected country"
            >
              ¡Empezar a Chatear!
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingModal;