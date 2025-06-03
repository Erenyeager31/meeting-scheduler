/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./*.{js,jsx,ts,tsx}",  // Files in root directory
    "./components/**/*.{js,jsx,ts,tsx}",  // If you have a components folder
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}