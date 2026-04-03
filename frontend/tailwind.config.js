/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gemini: {
          bg: 'var(--bg-color)',
          surface: 'var(--surface-color)',
          hover: 'var(--hover-color)',
          text: 'var(--text-color)',
          muted: 'var(--muted-color)',
          border: 'var(--border-color)',
          primary: '#A8C7FA',
          userBubble: 'var(--user-bubble-color)',
          messageBot: 'var(--message-bot-color)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
