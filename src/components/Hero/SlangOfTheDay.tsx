
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Persona } from '@/types/chat';
import { fallbackPersonas } from '@/lib/personas';

interface SlangOfTheDayProps {
  personas: Persona[];
}

const SlangOfTheDay: React.FC<SlangOfTheDayProps> = ({ personas }) => {
  const [currentSlang, setCurrentSlang] = useState<{ phrase: string; meaning: string; country: string; } | null>(null);

  useEffect(() => {
    // Select a random slang example based on personas
    const allPersonas = personas.length > 0 ? personas : fallbackPersonas;
    const randomPersona = allPersonas[Math.floor(Math.random() * allPersonas.length)];
    
    // Predefined slang examples per country (in real app, fetch from backend or database)
    const slangExamples = {
      mex: { phrase: "¿Qué onda?", meaning: "What's up? Casual greeting", country: 'México' },
      arg: { phrase: "Che, boludo", meaning: "Hey, dude - informal address", country: 'Argentina' },
      esp: { phrase: "Tío, guay", meaning: "Dude, cool - excited approval", country: 'España' },
      dom: { phrase: "Qué lo que", meaning: "What's up? Typical greeting", country: 'República Dominicana' }
    };

    const example = slangExamples[randomPersona.country_key as keyof typeof slangExamples] || 
                    { phrase: "¡Hola!", meaning: "Hello", country: randomPersona.displayName };

    setCurrentSlang(example);
  }, [personas]);

  if (!currentSlang) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6"
      role="complementary"
      aria-label="Example of slang of the day"
    >
      <h3 className="text-lg font-semibold mb-3 text-center text-gray-900 dark:text-white">
        Frase del Día
      </h3>
      <div className="text-center mb-4">
        <div className="text-2xl font-bold mb-2 text-primary.accent">
          "{currentSlang.phrase}"
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          <strong>Significado:</strong> {currentSlang.meaning}
        </p>
        <div className="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
          <span className="w-4 h-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-sm" aria-hidden="true" />
          {currentSlang.country}
        </div>
      </div>
      <motion.button
        className="btn-secondary w-full"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label="Learn more about this slang"
      >
        Ver Más Ejemplos
      </motion.button>
    </motion.div>
  );
};

export default SlangOfTheDay;