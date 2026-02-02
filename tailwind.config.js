/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: '#0b0c10',
        steel: '#1f2833',
        smoke: '#c5c6c7',
        crimson: '#d7263d',
        slate: '#4e5865'
      },
      fontFamily: {
        display: ['"Rajdhani"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        panel: '0 8px 24px rgba(0, 0, 0, 0.35)'
      }
    }
  },
  plugins: []
};
