/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        success: '#22c55e',
        danger: '#ef4444',
        surface: '#111827',
        card: '#1f2937',
      },
    },
  },
  plugins: [],
};
