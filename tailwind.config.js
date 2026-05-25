import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      typography: ({ theme }) => ({
        // prose-sb — Notion-style document treatment for the brainlift
        // viewer on a dark (sb-ink) surface. Tunes prose colors to the
        // sb-paper family and styles <details>/<summary> as collapsible
        // toggles that read as Notion blocks.
        sb: {
          css: {
            "--tw-prose-body": theme("colors.sb.paper-soft"),
            "--tw-prose-headings": theme("colors.white"),
            "--tw-prose-bold": theme("colors.white"),
            "--tw-prose-links": theme("colors.sb.accent"),
            "--tw-prose-code": theme("colors.sb.paper"),
            "--tw-prose-bullets": "rgb(255 255 255 / 0.4)",
            "--tw-prose-quotes": theme("colors.sb.paper"),
            "--tw-prose-quote-borders": theme("colors.sb.accent-deep"),
            "--tw-prose-counters": theme("colors.sb.paper-soft"),
            "--tw-prose-hr": "rgb(255 255 255 / 0.1)",
            // <details> / <summary> styling — Notion-like toggles.
            details: {
              marginTop: "1rem",
              marginBottom: "1rem",
              border: "1px solid rgb(255 255 255 / 0.1)",
              borderRadius: "0.75rem",
              background: "rgb(255 255 255 / 0.02)",
              overflow: "hidden",
              transition: "background-color 200ms",
            },
            "details[open]": {
              background: "rgb(255 255 255 / 0.03)",
            },
            // Nested details — slightly less visual weight to imply hierarchy.
            "details details": {
              border: "1px solid rgb(255 255 255 / 0.08)",
              background: "rgb(255 255 255 / 0.015)",
            },
            summary: {
              cursor: "pointer",
              listStyle: "none",
              padding: "0.75rem 1rem",
              fontFamily: theme("fontFamily.mono").join(", "),
              fontSize: "0.9rem",
              fontWeight: "600",
              color: theme("colors.sb.paper"),
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              userSelect: "none",
              transition: "color 200ms, background-color 200ms",
            },
            "summary:hover": {
              color: theme("colors.white"),
              backgroundColor: "rgb(255 255 255 / 0.04)",
            },
            "summary::-webkit-details-marker": { display: "none" },
            "summary::marker": { content: '""' },
            // CSS triangle that rotates when the details opens — replaces
            // the browser default ▶ marker.
            "summary::before": {
              content: '""',
              display: "inline-block",
              width: "0",
              height: "0",
              borderTop: "5px solid transparent",
              borderBottom: "5px solid transparent",
              borderLeft: `7px solid ${theme("colors.sb.accent")}`,
              transition: "transform 200ms",
              flexShrink: "0",
            },
            "details[open] > summary::before": {
              transform: "rotate(90deg)",
            },
            // Inner content padding — only when open.
            "details[open] > *:not(summary)": {
              padding: "0 1rem 0.75rem",
            },
            "details[open] > details": {
              padding: "0",
              margin: "0.5rem 1rem 0.75rem 1rem",
            },
            // Section name inside <summary><b>...</b></summary> should pop.
            "summary b, summary strong": {
              fontWeight: "700",
              color: theme("colors.white"),
            },
          },
        },
      }),
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
  plugins: [typography],
};
