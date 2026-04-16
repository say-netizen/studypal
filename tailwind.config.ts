import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green:  "#58CC02",
          blue:   "#1CB0F6",
          purple: "#9B5DE5",
          orange: "#FF9600",
          red:    "#FF4B4B",
        },
        xp: {
          gold:   "#FFD900",
          silver: "#C0C0C0",
          bronze: "#CD7F32",
        },
        surface: {
          card:    "#FFFFFF",
          "card-dark": "#1A1A2E",
          hover:   "#F7F7F7",
        },
        text: {
          primary:   "#2D3748",
          secondary: "#6B7280",
          muted:     "#9CA3AF",
          inverse:   "#FFFFFF",
        },
      },
      fontFamily: {
        display: ["var(--font-nunito)", "Nunito", "sans-serif"],
        body:    ["var(--font-inter)", "Inter", "sans-serif"],
        jp:      ["var(--font-mplus)", "M PLUS Rounded 1c", "sans-serif"],
      },
      fontSize: {
        "hero": ["clamp(2.5rem,5vw,4rem)", { lineHeight: "1.1", fontWeight: "900" }],
        "h1":   ["clamp(2rem,4vw,3rem)",   { lineHeight: "1.2", fontWeight: "800" }],
        "h2":   ["clamp(1.5rem,3vw,2.25rem)", { lineHeight: "1.3", fontWeight: "700" }],
      },
      borderRadius: {
        pill: "9999px",
        card: "1.25rem",
        "card-lg": "1.5rem",
      },
      boxShadow: {
        card:    "0 4px 20px rgba(0,0,0,0.08)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.15)",
        btn:     "0 4px 12px rgba(88,204,2,0.4)",
        "btn-blue": "0 4px 12px rgba(28,176,246,0.4)",
        glow:    "0 0 30px rgba(88,204,2,0.3)",
      },
      animation: {
        "fade-up":    "fadeUp 0.6s var(--ease-out) forwards",
        "float":      "float 5s ease-in-out infinite",
        "bounce-in":  "bounceIn 0.5s var(--ease-bounce) forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%":     { transform: "translateY(-12px)" },
        },
        bounceIn: {
          "0%":   { opacity: "0", transform: "scale(0.7)" },
          "60%":  { transform: "scale(1.15)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseGlow: {
          "0%,100%": { boxShadow: "0 0 20px rgba(88,204,2,0.3)" },
          "50%":     { boxShadow: "0 0 40px rgba(88,204,2,0.6)" },
        },
      },
      transitionTimingFunction: {
        bounce: "cubic-bezier(.34,1.56,.64,1)",
        "ease-out": "cubic-bezier(.16,1,.3,1)",
      },
    },
  },
  plugins: [],
  darkMode: "media",
};

export default config;
