import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        xs: '360px',
      },
      spacing: {
        'safe-t': 'env(safe-area-inset-top)',
        'safe-b': 'env(safe-area-inset-bottom)',
        'safe-l': 'env(safe-area-inset-left)',
        'safe-r': 'env(safe-area-inset-right)',
        /* Combined safe-top token (safe-area + fallback padding) */
        'safe-pt': 'calc(env(safe-area-inset-top) + 12px)',
      },
      colors: {
        'glass-light': 'rgba(255, 255, 255, 0.15)',
        'glass-medium': 'rgba(255, 255, 255, 0.25)',
        'glass-dark': 'rgba(31, 41, 55, 0.15)',
        'glass-blue': 'rgba(59, 130, 246, 0.15)',
        'glass-purple': 'rgba(147, 51, 234, 0.15)',
        'glass-emerald': 'rgba(16, 185, 129, 0.15)',
        'glass-border': 'rgba(255, 255, 255, 0.18)',
        'glass-border-dark': 'rgba(31, 41, 55, 0.18)',
        'glass-border-accent': 'rgba(59, 130, 246, 0.3)',
      },
      backdropBlur: {
        'xs': '2px',
        'glass': '16px',
        'glass-lg': '24px',
        'glass-xl': '40px',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1), 0 1.5px 0 rgba(255, 255, 255, 0.30) inset',
        'glass-hover': '0 8px 32px rgba(31, 38, 135, 0.37)',
        'glass-focus': '0 0 0 3px rgba(59, 130, 246, 0.1)',
      },
      animation: {
        'glass-float': 'glassFloat 6s ease-in-out infinite',
        'glass-pulse': 'glassPulse 2s ease-in-out infinite',
        'glass-shimmer': 'glassShimmer 3s linear infinite',
      },
      keyframes: {
        glassFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        glassPulse: {
          '0%, 100%': { opacity: '0.15' },
          '50%': { opacity: '0.25' }
        },
        glassShimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;