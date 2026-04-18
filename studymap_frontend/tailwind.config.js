/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6C63FF',
        surface: '#1E1E2E',
        card: '#2A2A3E',
        text: '#E2E8F0',
        muted: '#94A3B8',
        accent: '#38BDF8',
        success: '#4ADE80',
        warning: '#FACC15',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      transformOrigin: {
        '0': '0%',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}