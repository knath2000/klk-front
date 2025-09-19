import { useEffect, useState } from 'react';

export interface GlassSupportInfo {
  supported: boolean | null;
  backdropFilter: boolean;
  webkitBackdropFilter: boolean;
}

/**
 * Hook to detect browser support for glassmorphism effects
 * Returns null while checking, then boolean for support status
 */
export const useGlassSupport = (): GlassSupportInfo => {
  const [supportInfo, setSupportInfo] = useState<GlassSupportInfo>({
    supported: null,
    backdropFilter: false,
    webkitBackdropFilter: false,
  });

  useEffect(() => {
    const checkSupport = () => {
      if (typeof window === 'undefined' || typeof CSS === 'undefined') {
        return {
          supported: false,
          backdropFilter: false,
          webkitBackdropFilter: false,
        };
      }

      const backdropFilter = CSS.supports('backdrop-filter', 'blur(1px)');
      const webkitBackdropFilter = CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
      const supported = backdropFilter || webkitBackdropFilter;

      return {
        supported,
        backdropFilter,
        webkitBackdropFilter,
      };
    };

    setSupportInfo(checkSupport());
  }, []);

  return supportInfo;
};

/**
 * Simple hook that returns just the support boolean
 */
export const useBackdropFilterSupport = (): boolean | null => {
  const { supported } = useGlassSupport();
  return supported;
};

/**
 * Hook for conditional class names based on glass support
 */
export const useConditionalGlass = (
  glassClasses: string,
  fallbackClasses: string
): string => {
  const supported = useBackdropFilterSupport();
  
  if (supported === null) {
    // Loading state - use fallback to avoid layout shift
    return fallbackClasses;
  }
  
  return supported ? glassClasses : fallbackClasses;
};

/**
 * Hook for progressive enhancement of glass effects
 */
export const useProgressiveGlass = () => {
  const supportInfo = useGlassSupport();
  
  const getGlassStyle = (
    variant: 'light' | 'dark' | 'accent' = 'light',
    intensity: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    if (!supportInfo.supported) {
      // Fallback styles without backdrop-filter
      const fallbackStyles = {
        light: 'bg-white/90 border-white/20',
        dark: 'bg-gray-900/90 border-gray-700/30',
        accent: 'bg-blue-900/90 border-blue-400/30'
      };
      return fallbackStyles[variant];
    }

    // Full glass effect styles
    const glassStyles = {
      light: {
        low: 'bg-white/10 backdrop-blur-sm border-white/20',
        medium: 'bg-white/15 backdrop-blur-md border-white/25',
        high: 'bg-white/20 backdrop-blur-lg border-white/30'
      },
      dark: {
        low: 'bg-gray-900/10 backdrop-blur-sm border-gray-700/20',
        medium: 'bg-gray-900/15 backdrop-blur-md border-gray-700/25',
        high: 'bg-gray-900/20 backdrop-blur-lg border-gray-700/30'
      },
      accent: {
        low: 'bg-blue-500/10 backdrop-blur-sm border-blue-400/20',
        medium: 'bg-blue-500/15 backdrop-blur-md border-blue-400/25',
        high: 'bg-blue-500/20 backdrop-blur-lg border-blue-400/30'
      }
    };

    return glassStyles[variant][intensity];
  };

  return {
    ...supportInfo,
    getGlassStyle,
    hasSupport: supportInfo.supported === true,
    isLoading: supportInfo.supported === null,
  };
};