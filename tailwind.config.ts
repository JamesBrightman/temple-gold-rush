import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canyon: {
          50: "#fdf6ec",
          100: "#f8e8cf",
          200: "#f0d09f",
          300: "#e7b96f",
          400: "#dc9f4e",
          500: "#ce8233",
          600: "#b26527",
          700: "#8f4c23",
          800: "#723d22",
          900: "#5f341f"
        },
        jungle: {
          700: "#1e4d3e",
          800: "#193f33",
          900: "#122f27"
        }
      },
      boxShadow: {
        glow: "0 10px 30px rgba(19, 64, 51, 0.35)",
        panel: "0 12px 30px rgba(17, 46, 38, 0.24)"
      },
      keyframes: {
        popIn: {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" }
        },
        pulseSoft: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(220,159,78,0.5)" },
          "50%": { boxShadow: "0 0 0 8px rgba(220,159,78,0)" }
        }
      },
      animation: {
        popIn: "popIn 320ms ease-out",
        pulseSoft: "pulseSoft 1.8s infinite"
      }
    }
  },
  plugins: []
};

export default config;
