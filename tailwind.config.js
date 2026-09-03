/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Modern Community Blue Identity
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb", // Primary Royal Blue
          700: "#1d4ed8", // Deep Royal Blue
          800: "#1e40af", // Deep Blue
          900: "#1e3a8a", // Dark Navy Blue
          950: "#0f172a", // Dark Navy Slate
        },
        navy: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        sky: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
        },
        emerald: {
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
        canvas: "#F4F8FD",
        "card-border": "#E2E8F0",
      },
      borderRadius: {
        card: "14px",
        "card-sm": "10px",
        "card-lg": "16px",
      },
      boxShadow: {
        soft: "0 2px 10px rgba(30, 58, 138, 0.04)",
        card: "0 4px 20px -2px rgba(30, 58, 138, 0.06)",
        "card-hover": "0 10px 25px -3px rgba(30, 58, 138, 0.12), 0 4px 6px -4px rgba(30, 58, 138, 0.05)",
        glow: "0 0 15px rgba(37, 99, 235, 0.25)",
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          '"Inter"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

