/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", 
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#040d1a',
          900: '#071526',
          800: '#0a2040',
          700: '#0d2d5a',
          600: '#0d3d6b',
          500: '#1a4d82',
        },
        brand: {
          sky: '#38bdf8',
          teal: '#2dd4bf',
          cyan: '#22d3ee',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};