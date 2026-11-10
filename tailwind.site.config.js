/** Tailwind config for the website in docs/ (the extension popup uses tailwind.config.js). */
module.exports = {
  content: ["./site/build.js", "./site/pages.js", "./site/content/*.js"],
  theme: {
    extend: {
      colors: {
        ink: "#0B1220",
        page: "#EFF4FC",
        line: "#DCE6F5",
        muted: "#5B6B85",
        blue: { DEFAULT: "#3D7DFB", deep: "#2A5FDB" },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
