export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { navy: { 950: "#070b18", 900: "#0b1226", 800: "#111a33", 700: "#1a2547", 600: "#26345f" } },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"], mono: ["JetBrains Mono", "ui-monospace", "monospace"] },
    },
  },
  plugins: [],
};
