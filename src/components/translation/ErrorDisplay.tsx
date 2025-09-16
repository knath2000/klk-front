"use client";

import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ErrorDisplayProps {
  error: string | null;
  onRetry?: () => void;
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  const router = useRouter();

  const getErrorMessage = (error: string) => {
    if (error.includes('network') || error.includes('fetch')) {
      return {
        title: 'Connection Error',
        description: 'Unable to connect to the translation service. Please check your internet connection and try again.',
        icon: 'network'
      };
    }
    if (error.includes('timeout')) {
      return {
        title: 'Request Timeout',
        description: 'The translation request took too long to complete. Please try again.',
        icon: 'timeout'
      };
    }
    if (error.includes('rate limit') || error.includes('quota')) {
      return {
        title: 'Rate Limit Exceeded',
        description: 'Too many requests. Please wait a moment before trying again.',
        icon: 'rate-limit'
      };
    }
    return {
      title: 'Translation Error',
      description: error || 'An unexpected error occurred while processing your request.',
      icon: 'general'
    };
  };

  const errorInfo = getErrorMessage(error || '');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden"
    >
      <div className="p-8 text-center">
        {/* Error Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6"
        >
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </motion.div>

        {/* Error Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 dark:text-white mb-3"
        >
          {errorInfo.title}
        </motion.h2>

        {/* Error Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto"
        >
          {errorInfo.description}
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}

          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors duration-200"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        </motion.div>

        {/* Technical Details (Collapsible) */}
        {error && (
          <motion.details
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-left"
          >
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              Technical Details
            </summary>
            <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <code className="text-xs text-gray-600 dark:text-gray-400 break-all">
                {error}
              </code>
            </div>
          </motion.details>
        )}
      </div>
    </motion.div>
  );
}