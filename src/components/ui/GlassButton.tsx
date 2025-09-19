'use client';

import { motion } from 'framer-motion';
import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn, type GlassVariant, getGlassTextColor } from '@/lib/utils';
import { useProgressiveGlass } from '@/hooks/useGlassSupport';

// Exclude all potentially conflicting props
type ExcludedProps = 'onAnimationStart' | 'onAnimationEnd' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onTransitionEnd';

export interface GlassButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, ExcludedProps> {
  children: ReactNode;
  variant?: GlassVariant;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  animate?: boolean;
}

/**
 * GlassButton - Glassmorphism styled button component
 */
export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(({
  children,
  variant = 'blue',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  animate = true,
  className,
  disabled,
  ...props
}, ref) => {
  const { hasSupport } = useProgressiveGlass();

  const variants = {
    light: hasSupport 
      ? 'glass-light hover:bg-white/25' 
      : 'bg-white/90 hover:bg-white border-white/20 hover:border-white/30',
    dark: hasSupport 
      ? 'glass-dark hover:bg-gray-900/25' 
      : 'bg-gray-900/90 hover:bg-gray-900 border-gray-700/30 hover:border-gray-700/40',
    blue: hasSupport 
      ? 'glass-blue hover:bg-blue-500/25' 
      : 'bg-blue-900/90 hover:bg-blue-900 border-blue-400/30 hover:border-blue-400/40',
    purple: hasSupport 
      ? 'glass-purple hover:bg-purple-500/25' 
      : 'bg-purple-900/90 hover:bg-purple-900 border-purple-400/30 hover:border-purple-400/40',
    emerald: hasSupport 
      ? 'glass-emerald hover:bg-emerald-500/25' 
      : 'bg-emerald-900/90 hover:bg-emerald-900 border-emerald-400/30 hover:border-emerald-400/40',
    gradient: hasSupport
      ? 'glass-blue bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 hover:from-blue-500/30 hover:via-purple-500/30 hover:to-pink-500/30'
      : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-base rounded-xl',
    lg: 'px-6 py-3 text-lg rounded-xl',
    xl: 'px-8 py-4 text-xl rounded-2xl'
  };

  const textColor = variant === 'gradient' 
    ? 'text-white' 
    : getGlassTextColor(variant);

  return (
    <motion.button
      ref={ref}
      initial={animate ? { opacity: 0, scale: 0.95 } : undefined}
      animate={animate ? { opacity: 1, scale: 1 } : undefined}
      whileHover={!disabled ? {
        scale: 1.02,
        y: -2,
        boxShadow: "0 8px 32px rgba(31, 38, 135, 0.37)",
      } : undefined}
      whileTap={!disabled ? {
        scale: 0.98,
      } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        // Base styles
        'relative inline-flex items-center justify-center gap-2 font-medium',
        'transition-all duration-300 focus:outline-none',
        'border disabled:opacity-50 disabled:cursor-not-allowed',
        
        // Glass variant
        variants[variant],
        
        // Size
        sizes[size],
        
        // Text color
        textColor,
        
        // Full width
        fullWidth && 'w-full',
        
        // Focus styles
        'focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2',
        
        // Disabled styles
        disabled && 'pointer-events-none',
        
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {/* Loading spinner or left icon */}
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : leftIcon ? (
        <span className="flex-shrink-0">{leftIcon}</span>
      ) : null}
      
      {/* Button text */}
      <span className={cn(loading && 'opacity-0')}>{children}</span>
      
      {/* Right icon */}
      {!loading && rightIcon && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
      
      {/* Shimmer effect for gradient variant */}
      {variant === 'gradient' && hasSupport && (
        <div className="absolute inset-0 rounded-inherit bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-glass-shimmer opacity-0 hover:opacity-100 transition-opacity" />
      )}
    </motion.button>
  );
});

GlassButton.displayName = 'GlassButton';

// Preset button variants
export const GlassButtonPresets = {
  Primary: (props: Omit<GlassButtonProps, 'variant'>) => (
    <GlassButton variant="blue" {...props} />
  ),
  
  Secondary: (props: Omit<GlassButtonProps, 'variant'>) => (
    <GlassButton variant="light" {...props} />
  ),
  
  Accent: (props: Omit<GlassButtonProps, 'variant'>) => (
    <GlassButton variant="gradient" {...props} />
  ),
  
  Danger: (props: Omit<GlassButtonProps, 'variant'>) => (
    <GlassButton variant="purple" {...props} />
  ),
  
  Success: (props: Omit<GlassButtonProps, 'variant'>) => (
    <GlassButton variant="emerald" {...props} />
  ),
};