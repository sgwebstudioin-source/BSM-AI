/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: ["Space Grotesk", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "Menlo", "monospace"],
      },
      colors: {
        ink: {
          950: "#05060B",
          900: "#0A0C14",
          800: "#0F121C",
          700: "#161A28",
          600: "#1F2436",
        },
        accent: {
          cyan: "#22D3EE",
          violet: "#8B5CF6",
          lime: "#A3E635",
          rose: "#F43F5E",
          amber: "#F59E0B",
        },
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(60% 80% at 50% 0%, rgba(139,92,246,0.18) 0%, rgba(34,211,238,0.08) 30%, rgba(0,0,0,0) 70%)",
        "noise":
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(139,92,246,0.2), 0 8px 40px -10px rgba(34,211,238,0.25)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
