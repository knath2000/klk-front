/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Regional Spanish Country Accents
        mexico: '#00A651', // Vibrant green for Mexico
        argentina: '#6DCFF6', // Cool blue for Argentina
        spain: '#AA1C24', // Passionate red for Spain
        
        // Semantic Colors
        primary: {
          bg: '#0F0F0F', // Dark theme base
          text: '#FFFFFF', // High contrast text
          accent: '#007BFF', // Interactive elements
        },
        error: '#DC3545',
        success: '#28A745',
        warning: '#FFC107',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Readable sans-serif
      },
      fontSize: {
        // Scale in 4px increments
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '18px',
        'xl': '20px',
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
        // Multiples of 4px
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
        'soft': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'focus': '0 0 0 2px #007BFF',
      },
      borderRadius: {
        'xl': '12px',
      },
    },
  },
  plugins: [],
  darkMode: 'class', // Enable dark mode via class
}