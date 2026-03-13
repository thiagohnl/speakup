import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0A0F1E",
        teal: "#00E5CC",
        gold: "#C9922A",
        amber: "#F59E0B",
        success: "#22C55E",
        error: "#EF4444",
        "text-primary": "#F1F5F9",
        "text-secondary": "#94A3B8",
      },
      fontFamily: {
        display: ["var(--font-dm-serif)"],
        body: ["var(--font-dm-sans)"],
      },
    },
  },
  plugins: [],
};
export default config;
