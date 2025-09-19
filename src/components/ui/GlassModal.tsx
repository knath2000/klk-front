'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn, glassAnimations, type GlassVariant, getGlassTextColor } from '@/lib/utils';
import { useProgressiveGlass } from '@/hooks/useGlassSupport';

export interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  variant?: GlassVariant;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  overlayClassName?: string;
}

/**
 * GlassModal - Glassmorphism styled modal component
 */
export const GlassModal = ({
  isOpen,
  onClose,
  children,
  title,
  variant = 'dark',
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  overlayClassName,
}: GlassModalProps) => {
  const { hasSupport } = useProgressiveGlass();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else {
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const variants = {
    light: hasSupport 
      ? 'glass-light' 
      : 'bg-white/95 border-white/20',
    dark: hasSupport 
      ? 'glass-dark' 
      : 'bg-gray-900/95 border-gray-700/30',
    blue: hasSupport 
      ? 'glass-blue' 
      : 'bg-blue-900/95 border-blue-400/30',
    purple: hasSupport 
      ? 'glass-purple' 
      : 'bg-purple-900/95 border-purple-400/30',
    emerald: hasSupport 
      ? 'glass-emerald' 
      : 'bg-emerald-900/95 border-emerald-400/30',
    gradient: hasSupport
      ? 'glass-blue bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20'
      : 'bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600'
  };

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]'
  };

  const textColor = getGlassTextColor(variant === 'gradient' ? 'blue' : variant);

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={glassAnimations.overlayEnter.initial}
            animate={glassAnimations.overlayEnter.animate}
            exit={glassAnimations.overlayEnter.exit}
            transition={glassAnimations.overlayEnter.transition}
            className={cn(
              'absolute inset-0',
              hasSupport 
                ? 'bg-black/30 backdrop-blur-sm' 
                : 'bg-black/60',
              overlayClassName
            )}
            onClick={closeOnBackdropClick ? onClose : undefined}
          />

          {/* Modal Content */}
          <motion.div
            ref={modalRef}
            initial={glassAnimations.modalEnter.initial}
            animate={glassAnimations.modalEnter.animate}
            exit={glassAnimations.modalEnter.exit}
            transition={glassAnimations.modalEnter.transition}
            className={cn(
              'relative w-full rounded-2xl border shadow-2xl',
              'focus:outline-none',
              variants[variant],
              sizes[size],
              size === 'full' ? 'h-full overflow-auto' : 'max-h-[90vh] overflow-hidden',
              className
            )}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className={cn(
                'flex items-center justify-between p-6 border-b',
                variant === 'light' ? 'border-gray-200/20' : 'border-white/10'
              )}>
                {title && (
                  <h2 
                    id="modal-title"
                    className={cn('text-xl font-semibold', textColor)}
                  >
                    {title}
                  </h2>
                )}
                
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className={cn(
                      'p-2 rounded-lg transition-colors duration-200',
                      'hover:bg-black/10 focus:bg-black/10',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
                      textColor
                    )}
                    aria-label="Close modal"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className={cn(
              'p-6',
              size === 'full' && 'flex-1 overflow-auto'
            )}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Render in portal if we're on the client
  if (typeof window !== 'undefined') {
    return createPortal(modal, document.body);
  }

  return null;
};

// Preset modal variants
export const GlassModalPresets = {
  Confirmation: ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'blue'
  }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: GlassVariant;
  }) => (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant={variant}
      size="sm"
    >
      <div className="space-y-4">
        <p className={getGlassTextColor(variant, 'secondary')}>{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-current/20 hover:bg-current/10 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              'px-4 py-2 rounded-lg transition-colors',
              variant === 'blue' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
              variant === 'purple' ? 'bg-purple-500 hover:bg-purple-600 text-white' :
              variant === 'emerald' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' :
              'bg-gray-500 hover:bg-gray-600 text-white'
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </GlassModal>
  ),

  Loading: ({
    isOpen,
    title = 'Loading...',
    message
  }: {
    isOpen: boolean;
    title?: string;
    message?: string;
  }) => (
    <GlassModal
      isOpen={isOpen}
      onClose={() => {}}
      title={title}
      size="sm"
      showCloseButton={false}
      closeOnBackdropClick={false}
      closeOnEscape={false}
    >
      <div className="flex flex-col items-center space-y-4 py-4">
        <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
        {message && (
          <p className="text-center text-white/75">{message}</p>
        )}
      </div>
    </GlassModal>
  ),
};