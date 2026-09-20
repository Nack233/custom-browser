/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#121214',
        surface: '#1a1a1e',
        'surface-hover': '#242429',
        border: '#2c2c34',
        accent: '#6366f1',
      }
    },
  },
  plugins: [],
}
