'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Persona } from '@/types/chat';
import clsx from 'clsx';
import { createPortal } from 'react-dom';

interface CountrySelectorProps {
  personas: Persona[];
  selectedCountry: string | null;
  onCountrySelect: (countryKey: string) => void;
  disabled?: boolean;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({
  personas,
  selectedCountry,
  onCountrySelect,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedPersona = personas.find(p => p.country_key === selectedCountry);
  const items = personas.filter(p => p.safe_reviewed);

  const handleSelect = (countryKey: string) => {
    onCountrySelect(countryKey);
    setIsOpen(false);
  };

  // Update menu position when opened
  useEffect(() => {
    if (!triggerRef.current || !isOpen) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const width = 320; // Approximate menu width
    setMenuPos({
      top: rect.bottom + 8,
      left: Math.max(8, rect.right - width),
    });
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (disabled) return;
    const currentIndex = items.findIndex(p => p.country_key === selectedCountry);
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        newIndex = (index + 1) % items.length;
        break;
      case 'ArrowUp':
        e.preventDefault();
        newIndex = (index - 1 + items.length) % items.length;
        break;
      case 'Enter':
        e.preventDefault();
        handleSelect(items[index].country_key);
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
    }

    // Focus the new item
    if (newIndex !== currentIndex) {
      setTimeout(() => {
        const newItem = menuRef.current?.querySelectorAll('[role="option"]')[newIndex];
        (newItem as HTMLElement)?.focus();
      }, 0);
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <motion.button
        ref={triggerRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={clsx(
          "flex items-center gap-3 px-4 py-3.5 w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 min-w-[200px]",
          selectedCountry ? "border-blue-300 dark:border-blue-600" : "border-gray-200 dark:border-gray-700",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "ring-2 ring-blue-500 ring-opacity-50"
        )}
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select Country"
      >
        {/* Flag/Icon placeholder */}
        <div className="w-6 h-4 bg-gradient-to-r from-blue-500 to-red-500 rounded-sm flex-shrink-0" />

        <span className="text-base font-medium text-gray-700 dark:text-gray-300 flex-1 text-left">
          {selectedPersona ? selectedPersona.displayName : "Select Country"}
        </span>

        <motion.svg
          className="w-4 h-4 text-gray-500 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999]"
              onClick={() => {
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
              aria-hidden="true"
            />

            {/* Portal dropdown */}
            {typeof document !== 'undefined' && createPortal(
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="fixed z-[10000] w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-64 overflow-y-auto"
                style={{ top: menuPos.top, left: menuPos.left }}
                role="listbox"
                aria-label="Country options"
                tabIndex={-1}
              >
                {items.map((persona, index) => (
                  <motion.button
                    key={persona.id}
                    onClick={() => handleSelect(persona.country_key)}
                    className={clsx(
                      "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl",
                      selectedCountry === persona.country_key && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    )}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    role="option"
                    aria-selected={selectedCountry === persona.country_key}
                    tabIndex={0}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                  >
                    {/* Flag placeholder */}
                    <div className="w-6 h-4 bg-gradient-to-r from-green-500 to-yellow-500 rounded-sm flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      <div className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                        {persona.displayName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {persona.locale_hint}
                      </div>
                    </div>

                    {selectedCountry === persona.country_key && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0"
                      >
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </motion.div>,
              document.body
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Assuming the component uses a select or custom dropdown, ensure the select element has:
 * <select className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
 */
export default CountrySelector;