/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          page: '#FAFAF8',
          card: '#FFFFFF',
        },
        edge: {
          DEFAULT: '#E8E6E1',
          soft: '#EFEDE8',
        },
        ink: {
          DEFAULT: '#1C1B19',
          2: '#4B4A46',
          muted: '#8C8A83',
          faint: '#B4B2AB',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(28,27,25,.04), 0 1px 3px rgba(28,27,25,.05)',
        cardHi: '0 4px 14px rgba(28,27,25,.09)',
      },
      borderRadius: {
        tile: '11px',
      },
    },
  },
  plugins: [],
};
