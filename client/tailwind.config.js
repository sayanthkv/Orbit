/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        numbers: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Emerald primary
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        expense: {
          light: '#ffe4e6',
          DEFAULT: '#f43f5e', // Rose / coral
          dark: '#be123c',
        },
        income: {
          light: '#d1fae5',
          DEFAULT: '#10b981', // Emerald
          dark: '#047857',
        },
        transfer: {
          light: '#e0f2fe',
          DEFAULT: '#0284c7', // Sky / Cyan
          dark: '#0369a1',
        },
      },
    },
  },
  plugins: [],
}
