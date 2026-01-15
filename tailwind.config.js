/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Creda Brand Colors
        "primary": "#EAB308",
        "primary-hover": "#CA9A06",
        "primary-dim": "rgba(234, 179, 8, 0.1)",

        // Backgrounds
        "background-dark": "#1A1A1A",
        "surface-dark": "#121212",
        "card-dark": "#232323",
        "obsidian": "#151515",
        "obsidian-light": "#252525",

        // Text
        "text-cream": "#FCFAF7",
        "text-muted": "#A0A0A0",

        // Glass Effects
        "glass-border": "rgba(234, 179, 8, 0.15)",
        "glass-bg": "rgba(255, 255, 255, 0.03)",

        // Status Colors
        "verified": "#22C55E",
        "review": "#EAB308",
        "flagged": "#EF4444",
      },
      fontFamily: {
        "display": ["Manrope", "sans-serif"],
      },
      boxShadow: {
        'glow-primary': '0 0 20px -5px rgba(234, 179, 8, 0.3)',
        'glow-primary-lg': '0 0 30px rgba(234, 179, 8, 0.4)',
        'glow-card': '0 4px 30px rgba(0, 0, 0, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-verified': '0 0 15px rgba(34, 197, 94, 0.3)',
        'glow-flagged': '0 0 15px rgba(239, 68, 68, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'typing': 'typing 1.4s infinite ease-in-out both',
      },
      keyframes: {
        typing: {
          '0%, 80%, 100%': { transform: 'scale(0)', opacity: '0.5' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh': `
          radial-gradient(at 0% 0%, hsla(43, 66%, 20%, 0.15) 0px, transparent 50%),
          radial-gradient(at 100% 0%, hsla(0, 0%, 15%, 1) 0px, transparent 50%),
          radial-gradient(at 100% 100%, hsla(43, 66%, 10%, 0.1) 0px, transparent 50%)
        `,
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
