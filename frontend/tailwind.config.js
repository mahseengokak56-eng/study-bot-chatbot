/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gemini: {
          bg: '#131314',
          surface: '#1E1F20',
          hover: '#333537',
          text: '#E3E3E3',
          muted: '#C4C7C5',
          border: '#444746',
          primary: '#A8C7FA', // Used for links or active states
          userBubble: '#2B2D31'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
