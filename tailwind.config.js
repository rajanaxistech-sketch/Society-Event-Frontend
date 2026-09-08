/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Soft Lavender Community Palette
        lavender: {
          50: "#F8F7FC", // Top Navbar Tint
          100: "#F3F4FA", // Main Page Background
          200: "#EEF2FF", // Secondary Background / Sidebar Background
          300: "#E0E7FF", // Active Menu / Selected Row
          400: "#C7D2FE",
          500: "#A5B4FC",
        },
        primary: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1", // Soft Indigo
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
        },
        secondary: {
          50: "#FAF5FF",
          100: "#F3E8FF",
          200: "#E9D5FF",
          300: "#D8B4FE",
          400: "#C084FC",
          500: "#8B5CF6", // Soft Purple
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
        },
        teal: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6", // Soft Teal (Community Accent)
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
        },
        amber: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B", // Soft Amber (Warm Accent)
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },
        canvas: "#F3F4FA",
        "card-bg": "#FFFFFF",
        "card-border": "#E2E8F0",
      },
      borderRadius: {
        card: "10px",
        "card-sm": "8px",
        "card-lg": "12px",
      },
      boxShadow: {
        "2xs": "0 1px 2px 0 rgba(99, 102, 241, 0.04)",
        xs: "0 1px 2px 0 rgba(15, 23, 42, 0.05)",
        soft: "0 2px 6px -2px rgba(99, 102, 241, 0.05), 0 1px 2px 0 rgba(15, 23, 42, 0.03)",
        card: "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(99, 102, 241, 0.02)",
        "card-hover": "0 4px 12px -2px rgba(99, 102, 241, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.03)",
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

