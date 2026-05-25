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
          200: "#C3CCDA",
          500: "#3B4A6B",
          900: "#1A2237",
        },
        // Superbuilders parent-brand tokens (extracted from their CSS bundles).
        // Monochrome + warm-pewter accent. Light mode adaptation here.
        sb: {
          ink: "#1A1A1A",
          surface: "#F5F5F5",
          card: "#FFFFFF",
          border: "#E5E5E5",
          muted: "#5B5B5B",
          subtle: "#A3A3A3",
          accent: "#BFA68A", // hsl(30 30% 64%) — warm pewter / champagne
          "accent-soft": "#E8DECC",
          "accent-deep": "#8C7556",
          // Warm bridge tokens: used on lesson UI chrome (speech bubble,
          // overlays, pickers) to harmonize with the in-world scene art
          // without abandoning the parent SB palette. Mirrors the Freddy
          // card's champagne gradient.
          paper: "#EFE7DA", // primary warm UI surface
          "paper-deep": "#F1E5D0", // warmer accent — emphasis / hover
          "paper-soft": "#F5F2EC", // palest — subtle warmth
        },
      },
      fontFamily: {
        // Placeholders; refine after brand research
        display: ['"Fredoka"', "system-ui", "sans-serif"],
        body: ['"Nunito"', "system-ui", "sans-serif"],
        // Superbuilders parent-brand pair.
        // Production SB wordmark uses PP Variant Mono (paid, Pangram Pangram).
        // We ship Geist Mono as the closest free analogue — swap to PP Variant
        // Mono here once a license is in place and the woff2 is in /public/fonts/.
        mono: ['"Geist Mono"', "ui-monospace", "monospace"],
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};
