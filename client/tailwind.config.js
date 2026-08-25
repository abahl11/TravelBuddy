/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', lg: '2rem' },
      screens: { '2xl': '1200px' },
    },
    extend: {
      colors: {
        // Indigo-leaning primary: the brand colour for actions and links.
        primary: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd3ff',
          300: '#8eb5ff',
          400: '#598cff',
          500: '#3563ff',
          600: '#1f41f5',
          700: '#1a31e1',
          800: '#1c2bb6',
          900: '#1d2b8f',
          950: '#151a57',
        },
        // Warm accent for highlights, badges and the hero.
        accent: {
          50: '#fff8ed',
          100: '#ffefd4',
          200: '#ffdba8',
          300: '#ffc171',
          400: '#ff9d38',
          500: '#ff8011',
          600: '#f06407',
          700: '#c74a08',
          800: '#9e3a0f',
          900: '#7f3210',
        },
        ink: {
          50: '#f6f7f9',
          100: '#eceff3',
          200: '#d5dbe4',
          300: '#b0bbcb',
          400: '#8496ad',
          500: '#647893',
          600: '#4f6079',
          700: '#414e63',
          800: '#394353',
          900: '#333b48',
          950: '#22272f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 4px 16px rgba(16, 24, 40, 0.06)',
        'card-hover': '0 4px 8px rgba(16, 24, 40, 0.06), 0 16px 40px rgba(16, 24, 40, 0.12)',
        glow: '0 10px 40px -12px rgba(53, 99, 255, 0.45)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};
