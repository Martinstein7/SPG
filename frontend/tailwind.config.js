/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'spotify-green': '#1DB954',
        'spotify-black': '#191414',
        'dark-base': '#0E0B14',
        'dark-surface': '#1A1625',
        'primary-purple': '#6C5CE7',
      }
    },
  },
  plugins: [],
}

