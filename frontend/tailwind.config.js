/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          50: '#0a1628',
          100: '#0f1f3d',
          200: '#142952',
          400: '#00d4ff',
          500: '#00f0ff',
          600: '#00d4e6',
          700: '#00b8cc',
          800: '#00e0ff',
        },
        neon: {
          cyan: '#00f0ff',
          magenta: '#ff00ff',
          green: '#39ff14',
          pink: '#ff1493',
          purple: '#b026ff',
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(0, 240, 255, 0.5), 0 0 20px rgba(0, 240, 255, 0.3)',
        'neon-magenta': '0 0 10px rgba(255, 0, 255, 0.5), 0 0 20px rgba(255, 0, 255, 0.3)',
        'neon-green': '0 0 10px rgba(57, 255, 20, 0.5), 0 0 20px rgba(57, 255, 20, 0.3)',
      },
    },
  },
  plugins: [],
}
