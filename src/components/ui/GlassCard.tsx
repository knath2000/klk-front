'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { ReactNode, forwardRef } from 'react';
import { cn, glassAnimations, type GlassVariant, type GlassSize, type GlassBlur } from '@/lib/utils';
import { useProgressiveGlass } from '@/hooks/useGlassSupport';

export interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  variant?: GlassVariant;
  size?: GlassSize;
  blur?: GlassBlur;
  hover?: boolean;
  animate?: boolean;
  gradient?: boolean;
  floating?: boolean;
  loading?: boolean;
}

/**
 * GlassCard - The base glassmorphism component
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(({
  children,
  variant = 'light',
  size = 'md',
  blur = 'lg',
  hover = false,
  animate = true,
  gradient = false,
  floating = false,
  loading = false,
  className,
  ...props
}, ref) => {
  const { hasSupport } = useProgressiveGlass();

  const variants = {
    light: hasSupport ? 'glass-light' : 'bg-white/90 border-white/20',
    dark: hasSupport ? 'glass-dark' : 'bg-gray-900/90 border-gray-700/30',
    blue: hasSupport ? 'glass-blue' : 'bg-blue-900/90 border-blue-400/30',
    purple: hasSupport ? 'glass-purple' : 'bg-purple-900/90 border-purple-400/30',
    emerald: hasSupport ? 'glass-emerald' : 'bg-emerald-900/90 border-emerald-400/30',
    gradient: hasSupport 
      ? 'glass-blue bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20' 
      : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600'
  };

  const sizes = {
    sm: 'p-3 rounded-xl',
    md: 'p-4 rounded-2xl',
    lg: 'p-6 rounded-2xl',
    xl: 'p-8 rounded-3xl'
  };

  const hoverAnimation = hover ? {
    scale: 1.02,
    y: -2,
    boxShadow: "0 8px 32px rgba(31, 38, 135, 0.37)",
  } : undefined;

  const pressAnimation = hover ? {
    scale: 0.98,
  } : undefined;

  return (
    <motion.div
      ref={ref}
      initial={animate ? glassAnimations.cardEnter.initial : undefined}
      animate={animate ? glassAnimations.cardEnter.animate : undefined}
      whileHover={hoverAnimation}
      whileTap={pressAnimation}
      transition={glassAnimations.cardEnter.transition}
      className={cn(
        'relative overflow-hidden border transition-all duration-300',
        variants[variant],
        sizes[size],
        hover && 'glass-hover cursor-pointer',
        loading && 'animate-pulse',
        className
      )}
      {...props}
    >
      {gradient && hasSupport && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-glass-shimmer" />
      )}
      
      <div className={cn('relative z-10', loading && 'opacity-50')}>
        {children}
      </div>
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-inherit">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60" />
        </div>
      )}
    </motion.div>
  );
});

GlassCard.displayName = 'GlassCard';