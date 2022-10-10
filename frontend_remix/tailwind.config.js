/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "custom-green": "#074F57",
        "custom-gray":"#D9D8E1"
      }
    },
  },
  plugins: [],
}