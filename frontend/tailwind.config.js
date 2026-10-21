/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        office: {
          dark: '#0f172a',
          board: '#1e293b',
          wood: '#854d0e',
          carpet: '#1e1b4b',
          accent: '#38bdf8'
        }
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace']
      }
    },
  },
  plugins: [],
};
