/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d7eaff",
          600: "#0f4c81",
          700: "#0b3d67",
        },
      },
    },
  },
  plugins: [],
};
