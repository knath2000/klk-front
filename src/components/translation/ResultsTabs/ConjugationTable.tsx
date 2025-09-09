"use client";

import { motion } from "framer-motion";
import { ConjugationTableProps } from "./resultsTabs.types";

export default function ConjugationTable({ conjugations, word }: ConjugationTableProps) {
  if (!conjugations) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No conjugations available for &quot;{word}&quot;</p>
      </div>
    );
  }

  const tenses = Object.keys(conjugations) as Array<keyof typeof conjugations>;
  const pronouns = ["yo", "tú", "él/ella", "nosotros", "vosotros", "ellos/ellas"];

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Verb Conjugations for &quot;{word}&quot;
      </h3>

      <div className="space-y-8">
        {tenses.map((tense, tenseIndex) => {
          const tenseData = conjugations[tense];
          if (!tenseData) return null;

          return (
            <motion.div
              key={tense}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: tenseIndex * 0.1, duration: 0.3 }}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
            >
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 capitalize">
                  {tense.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conjugation
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pronouns.map((pronoun, index) => {
                      const conjugation = tenseData[pronoun];
                      const isIrregular = conjugation && conjugation.includes("*");

                      return (
                        <motion.tr
                          key={pronoun}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (tenseIndex * 0.1) + (index * 0.05) }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {pronoun}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            <span className={isIrregular ? "font-semibold text-orange-600" : ""}>
                              {conjugation || "—"}
                              {isIrregular && (
                                <span className="ml-1 text-xs text-orange-500" title="Irregular form">
                                  *
                                </span>
                              )}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Legend for irregular forms */}
              {Object.values(tenseData).some(conj => conj?.includes("*")) && (
                <div className="px-6 py-3 bg-orange-50 border-t border-orange-200">
                  <p className="text-sm text-orange-700">
                    <span className="font-medium">*</span> Indicates irregular conjugation
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {tenses.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: tenses.length * 0.1 + 0.2 }}
          className="mt-6 p-4 bg-blue-50 rounded-lg"
        >
          <p className="text-sm text-blue-700">
            💡 <strong>Tip:</strong> Irregular forms are marked with an asterisk (*).
            Hover over them for additional information about the irregularity.
          </p>
        </motion.div>
      )}
    </div>
  );
}