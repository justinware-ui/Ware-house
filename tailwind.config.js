/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FF9356',
          600: '#ea580c',
          700: '#c2410c',
        },
        navy: {
          600: '#1e3a5f',
        },
        dark: {
          bg: '#1E1B18',
          surface: '#2A2622',
          card: '#302C28',
          border: '#3D3834',
          text: '#F5F0EB',
          'text-secondary': '#A8A29E',
          'text-muted': '#78716C',
          input: '#2A2622',
          'input-border': '#4A4540',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
