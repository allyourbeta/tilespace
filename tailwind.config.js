/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          page: '#FAFAF8',
          card: '#FFFFFF',
          subtle: '#FCFCFB',
          hover: '#F6F5F2',
        },
        edge: {
          DEFAULT: '#E8E6E1',
          soft: '#EFEDE8',
          hover: '#DAD8D2',
          tilehover: '#DEDCD6',
          placeholder: '#D8D6D0',
          grip: '#E0DED8',
        },
        ink: {
          DEFAULT: '#1C1B19',
          2: '#4B4A46',
          muted: '#8C8A83',
          faint: '#B4B2AB',
          grip: '#B9B7B0',
        },
        danger: {
          DEFAULT: '#B91C1C',
          tint: '#FEF2F2',
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
