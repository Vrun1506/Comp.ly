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
        "warm-brown": {
          50:  "#FAF7F4",
          100: "#F0EBE3",
          200: "#E2D9CC",
          300: "#D4C5B0",
          400: "#C4A882",
          500: "#B8845C",
          600: "#A0724D",
          700: "#7D5A3D",
          800: "#5A412D",
          900: "#38281C",
        },
        "warm-grey": {
          50:  "#FAF9F7",
          100: "#F0EEEA",
          200: "#EDEBE6",
          300: "#D6D2CB",
          400: "#A39E95",
          500: "#8A857C",
          600: "#6B6459",
          700: "#524D44",
          800: "#3A362F",
          900: "#1A1612",
        },
        "warm-white": "#FAFAF8",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
