/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primaryGreen: '#10B981',
        emergencyRed: '#EF4444',
        warningOrange: '#F59E0B',
        infoBlue: '#3B82F6',
        darkRed: '#991B1B',
      }
    },
  },
  plugins: [],
}
