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
      keyframes: {
        'xp-float': {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-40px)' },
        },
        'level-up': {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '50%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'badge-reveal': {
          '0%': { transform: 'scale(0) rotate(-180deg)', opacity: '0' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
      },
      animation: {
        'xp-float': 'xp-float 1.2s ease-out forwards',
        'level-up': 'level-up 0.6s ease-out',
        'badge-reveal': 'badge-reveal 0.5s ease-out',
      },
    },
  },
  plugins: [],
};
export default config;
