import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sf-pro-text)", "system-ui", "sans-serif"],
        display: ["var(--font-sf-pro-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-sf-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        apple: {
          blue: "#007AFF",
          green: "#34C759",
          orange: "#FF9500",
          red: "#FF3B30",
          purple: "#AF52DE",
          pink: "#FF2D55",
          teal: "#5AC8FA",
          indigo: "#5856D6",
          gray: {
            1: "#8E8E93",
            2: "#636366",
            3: "#48484A",
            4: "#3A3A3C",
            5: "#2C2C2E",
            6: "#1C1C1E",
          },
        },
        surface: {
          light: "#F2F2F7",
          dark: "#2C2C2E",
        },
        background: {
          light: "#FFFFFF",
          dark: "#1C1C1E",
        },
      },
      borderRadius: {
        card: "12px",
        button: "8px",
        modal: "20px",
      },
      boxShadow: {
        apple: "0 2px 10px rgba(0,0,0,0.08)",
        "apple-lg": "0 4px 20px rgba(0,0,0,0.12)",
        "apple-dark": "0 2px 10px rgba(0,0,0,0.3)",
      },
      spacing: {
        grid: "8px",
      },
      animation: {
        "spring-in": "spring-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "fade-in": "fade-in 0.2s ease-out",
      },
      keyframes: {
        "spring-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
