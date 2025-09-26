'use client';

import { motion } from 'framer-motion';
import { InputHTMLAttributes, ReactNode, forwardRef, useState } from 'react';
import { cn, glassAnimations, type GlassVariant, getGlassTextColor } from '@/lib/utils';

export interface GlassInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'onDrag'> {
  variant?: GlassVariant;
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  label?: string;
  error?: string;
  success?: boolean;
  loading?: boolean;
  animate?: boolean;
}

/**
 * GlassInput - Glassmorphism styled input component
 */
export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(({
  variant = 'light',
  size = 'md',
  leftIcon,
  rightIcon,
  label,
  error,
  success = false,
  loading = false,
  animate = true,
  className,
  placeholder,
  value,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);

  const variants = {
    light: 'bg-white/90 focus:bg-white border-white/20 focus:border-white/40 glass-light',
    dark: 'bg-gray-900/90 focus:bg-gray-900 border-gray-700/30 focus:border-gray-700/50 glass-dark',
    blue: 'bg-blue-900/90 focus:bg-blue-900 border-blue-400/30 focus:border-blue-400/50 glass-blue',
    purple: 'bg-purple-900/90 focus:bg-purple-900 border-purple-400/30 focus:border-purple-400/50 glass-purple',
    emerald: 'bg-emerald-900/90 focus:bg-emerald-900 border-emerald-400/30 focus:border-emerald-400/50 glass-emerald',
    gradient: 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 focus:from-blue-700 focus:via-purple-700 focus:to-pink-700 glass-blue'
  };

  const sizes = {
    sm: 'h-9 px-3 text-sm rounded-lg',
    md: 'h-11 px-4 text-base rounded-xl',
    lg: 'h-13 px-5 text-lg rounded-xl'
  };

  const textColor = getGlassTextColor(variant === 'gradient' ? 'blue' : variant);
  const placeholderColor = variant === 'light' ? 'placeholder:text-gray-500' : 'placeholder:text-white/50';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(!!e.target.value);
    props.onChange?.(e);
  };

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 10 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      className="relative w-full"
    >
      {/* Label */}
      {label && (
        <motion.label
          initial={false}
          animate={{
            scale: isFocused || hasValue ? 0.85 : 1,
            y: isFocused || hasValue ? -24 : 0,
            x: isFocused || hasValue ? -2 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            'absolute left-4 pointer-events-none transition-colors duration-200 origin-left',
            isFocused ? 'text-blue-400' : textColor,
            sizes[size].includes('h-9') ? 'top-2' : 
            sizes[size].includes('h-11') ? 'top-3' : 'top-4'
          )}
        >
          {label}
        </motion.label>
      )}

      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none',
            textColor
          )}>
            {leftIcon}
          </div>
        )}

        {/* Input - Use regular input element instead of motion.input to avoid prop conflicts */}
        <input
          ref={ref}
          className={cn(
            // Base styles
            'w-full border transition-all duration-300 outline-none',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            
            // Glass variant
            variants[variant],
            
            // Size
            sizes[size],
            
            // Text and placeholder colors
            textColor,
            placeholderColor,
            
            // Padding adjustments for icons
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            
            // Label adjustments
            label && 'pt-6 pb-2',
            
            // State styles
            error && 'border-red-400 focus:border-red-400',
            success && 'border-emerald-400 focus:border-emerald-400',
            
            className
          )}
          placeholder={label ? undefined : placeholder}
          value={value}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          onChange={handleChange}
          {...props}
        />

        {/* Right Icon / Loading */}
        {(rightIcon || loading) && (
          <div className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 flex items-center',
            textColor
          )}>
            {loading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : rightIcon ? (
              rightIcon
            ) : null}
          </div>
        )}

        {/* Success/Error indicators */}
        {(success || error) && !rightIcon && !loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {success && (
              <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {error && (
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-red-400"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
});

GlassInput.displayName = 'GlassInput';

// Preset input variants
export const GlassInputPresets = {
  Search: (props: Omit<GlassInputProps, 'leftIcon' | 'type'>) => (
    <GlassInput
      type="search"
      leftIcon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      {...props}
    />
  ),
  
  Email: (props: Omit<GlassInputProps, 'leftIcon' | 'type'>) => (
    <GlassInput
      type="email"
      leftIcon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
        </svg>
      }
      {...props}
    />
  ),
  
  Password: (props: Omit<GlassInputProps, 'type'>) => (
    <GlassInput
      type="password"
      leftIcon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      }
      {...props}
    />
  ),
};