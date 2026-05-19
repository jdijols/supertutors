/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // SuperSlice / Freddy palette — warm Italian-American
        // (placeholder values — refine after Superbuilders brand research round)
        terracotta: {
          50: "#FBF2EC",
          100: "#F4DDCB",
          200: "#E8B391",
          300: "#DB8757",
          400: "#C76833",
          500: "#A04D22",
          600: "#7E3A17",
        },
        mozzarella: {
          50: "#FFFBF2",
          100: "#FFF4DC",
          200: "#FCE9BA",
          300: "#F4D996",
        },
        tomato: {
          400: "#E84A3E",
          500: "#C43325",
          600: "#9E2418",
        },
        basil: {
          400: "#6CA64A",
          500: "#4E8133",
        },
        oven: {
          glow: "#F2A93B",
        },
        // SuperTutors landing palette — slightly cooler/portal-like
        portal: {
          50: "#F5F7FA",
          100: "#E4E9F0",
          500: "#3B4A6B",
          900: "#1A2237",
        },
      },
      fontFamily: {
        // Placeholders; refine after brand research
        display: ['"Fredoka"', "system-ui", "sans-serif"],
        body: ['"Nunito"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
