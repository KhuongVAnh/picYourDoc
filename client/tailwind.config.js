/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EAF3FB",
          100: "#D7E8F8",
          200: "#B8D4EE",
          300: "#8CB6DF",
          500: "#1C5EA8",
          600: "#0F4C81",
          700: "#0C3E6A",
          800: "#082F52",
          900: "#041C33",
        },
        accent: {
          teal: "#1DAAA0",
          orange: "#F39A32",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["Be Vietnam Pro", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel: "0 12px 28px rgba(15, 76, 129, 0.08)",
      },
      borderRadius: {
        panel: "1rem",
      },
      backgroundImage: {
        "doctor-sidebar": "linear-gradient(180deg, #0F4C81 0%, #0C3E6A 50%, #082F52 100%)",
      },
    },
  },
  plugins: [],
};
