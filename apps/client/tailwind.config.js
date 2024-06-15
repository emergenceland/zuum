/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        main: '#B1DBC5',
        dark: '#26463F',
        light: '#FDFFA7',
        white: '#FFFFFF',
        system_light: '#3a172f12'
      },
      height: {
        content: 'var(--viewport-height)'
      },
      fontFamily: {
        body: ['"Inter"', 'sans-serif'],
        space: ['"Space Mono"', 'monospace']
      }
    },
  },
  plugins: [],
};
