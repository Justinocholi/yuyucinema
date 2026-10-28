import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        yugito: {
          bg: "#070b16",             // Deep Obsidian Midnight Blue
          bgDeep: "#040711",         // Ultra-dark background base
          surface: "#0c1527",        // Frosted midnight blue panel
          surfaceGlass: "rgba(12, 21, 39, 0.75)",
          card: "#101d36",           // Deep sapphire card
          cardGlass: "rgba(16, 29, 54, 0.65)",
          border: "#1e2e4f",         // Glowing sapphire border
          borderSubtle: "#14213d",
          borderGlass: "rgba(56, 189, 248, 0.15)",
          accent: "#2563eb",         // Vibrant Electric Cobalt
          accentHover: "#1d4ed8",
          accentLight: "#60a5fa",    // Sky blue highlight
          accentCyan: "#38bdf8",     // Radiant cyan glow
          text: "#f0f6fc",
          muted: "#94a3b8",
          subtle: "#64748b",
          red: "#ef4444",
          green: "#10b981",
          gold: "#f59e0b",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        yugito: "0 8px 32px 0 rgba(2, 6, 23, 0.6)",
        yugitoGlow: "0 0 30px rgba(37, 99, 235, 0.3)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(255, 255, 255, 0.08)",
        glassHover: "0 12px 40px 0 rgba(14, 165, 233, 0.25), inset 0 0 0 1px rgba(56, 189, 248, 0.3)",
      },
      animation: {
        fadeIn: "fadeIn 0.25s ease-in-out forwards",
        slideUp: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
