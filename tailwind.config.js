/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mexico: 'var(--mexico, #00A651)',
        argentina: 'var(--argentina, #6DCFF6)',
        spain: 'var(--spain, #AA1C24)',
        primary: {
          bg: 'var(--primary-bg, #0F0F0F)',
          text: 'var(--primary-text, #FFFFFF)',
          accent: 'var(--primary-accent, #007BFF)',
        },
        error: 'var(--error, #DC3545)',
        success: 'var(--success, #28A745)',
        warning: 'var(--warning, #FFC107)',
      },
      fontFamily: {
        sans: ['var(--font-sans, Inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '28px',
        '4xl': '32px',
        '5xl': '40px',
        '6xl': '48px',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        bold: '700',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'scale-hover': 'scaleHover 0.2s ease-in-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleHover: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.05)' },
        },
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0, 0, 0, 0.1)',
        focus: '0 0 0 2px #007BFF',
      },
      borderRadius: {
        xl: '12px',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
