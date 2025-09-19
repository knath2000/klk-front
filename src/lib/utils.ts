import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Glassmorphism utilities
export const glassVariants = {
  light: "glass-light",
  dark: "glass-dark", 
  blue: "glass-blue",
  purple: "glass-purple",
  emerald: "glass-emerald",
  gradient: "glass-gradient",
} as const;

export const glassSizes = {
  sm: "p-3 rounded-xl backdrop-blur-sm",
  md: "p-4 rounded-2xl",
  lg: "p-6 rounded-2xl backdrop-blur-lg", 
  xl: "p-8 rounded-3xl backdrop-blur-xl",
} as const;

export const glassBlurs = {
  none: "",
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
  lg: "backdrop-blur-lg",
  xl: "backdrop-blur-xl",
} as const;

export type GlassVariant = keyof typeof glassVariants;
export type GlassSize = keyof typeof glassSizes;
export type GlassBlur = keyof typeof glassBlurs;

// Feature detection for backdrop-filter support
export const supportsBackdropFilter = (): boolean => {
  if (typeof window === "undefined") return false;
  
  return (
    CSS.supports("backdrop-filter", "blur(1px)") ||
    CSS.supports("-webkit-backdrop-filter", "blur(1px)")
  );
};

// Generate glass classes based on props
export const getGlassClasses = ({
  variant = "light",
  size = "md", 
  blur = "lg",
  hover = false,
  focus = false,
  className = "",
}: {
  variant?: GlassVariant;
  size?: GlassSize;
  blur?: GlassBlur;
  hover?: boolean;
  focus?: boolean;
  className?: string;
}) => {
  return cn(
    glassVariants[variant],
    glassSizes[size],
    glassBlurs[blur],
    hover && "glass-hover",
    focus && "glass-focus",
    className
  );
};

// Animation spring configs with proper Framer Motion types
export const glassAnimations = {
  // Card entrance
  cardEnter: {
    initial: { opacity: 0, y: 10, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { type: "spring" as const, stiffness: 70, damping: 16 }
  },

  // Staggered list
  staggerContainer: {
    animate: { transition: { staggerChildren: 0.1 } }
  },

  staggerItem: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 }
  },

  // Hover effects
  glassHover: {
    scale: 1.02,
    y: -2,
    boxShadow: "0 8px 32px rgba(31, 38, 135, 0.37)",
    transition: { type: "spring", stiffness: 300, damping: 20 }
  },

  // Focus effects
  glassFocus: {
    scale: 1.01,
    borderColor: "rgba(59, 130, 246, 0.4)",
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)"
  },

  // Button interactions
  buttonPress: {
    scale: 0.98,
  },

  // Modal/overlay animations
  modalEnter: {
    initial: { opacity: 0, scale: 0.98, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
    transition: { type: "spring" as const, stiffness: 300, damping: 30 }
  },

  // Background blur overlay
  overlayEnter: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
  },

  // Floating animation
  float: {
    y: [-10, 0, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },

  // Pulse animation for loading states
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [0.15, 0.25, 0.15],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Gradient background utilities
export const gradientBackgrounds = {
  chat: "bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900",
  translate: "bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900", 
  enterprise: "bg-gradient-to-br from-orange-900 via-red-900 to-pink-900",
  default: "bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900"
} as const;

export type GradientBackground = keyof typeof gradientBackgrounds;

// Utility to get random floating orb positions
export const generateFloatingOrbs = (count: number = 3) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 200 + 150, // 150-350px
    x: Math.random() * 80 + 10, // 10-90%
    y: Math.random() * 80 + 10, // 10-90%
    color: [
      "bg-blue-500/20",
      "bg-purple-500/15", 
      "bg-emerald-500/20",
      "bg-pink-500/15",
      "bg-cyan-500/20"
    ][Math.floor(Math.random() * 5)],
    duration: Math.random() * 10 + 15 // 15-25 seconds
  }));
};

// Text color utilities for glass backgrounds
export const glassTextColors = {
  primary: "text-white/95",
  secondary: "text-white/75",
  muted: "text-white/55",
  dark: "text-gray-900/90",
  darkSecondary: "text-gray-900/70"
} as const;

// Helper to determine if we should use dark text on light glass
export const shouldUseDarkText = (variant: GlassVariant): boolean => {
  return variant === "light";
};

// Get appropriate text color for glass variant
export const getGlassTextColor = (
  variant: GlassVariant,
  level: keyof typeof glassTextColors = "primary"
): string => {
  if (shouldUseDarkText(variant)) {
    return level === "primary" ? glassTextColors.dark : glassTextColors.darkSecondary;
  }
  return glassTextColors[level];
};