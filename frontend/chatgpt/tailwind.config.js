/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        parkinsas: ["Parkinsans", "sans-serif"],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        sidebar: {
          light: "#f9f9f9",
          dark: "#171717",
        },
        chatbg: {
          light: "#ffffff",
          dark: "#212121",
        },
      },
    },
  },
  plugins: [],
};
