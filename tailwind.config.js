/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./*.{js,jsx,ts,tsx}",
      "./screens/**/*.{js,jsx,ts,tsx}",
      "./components/**/*.{js,jsx,ts,tsx}",
      "./context/**/*.{js,jsx,ts,tsx}",
      "./src/**/*.{js,jsx,ts,tsx}"
    ],
    theme: {
      extend: {
        screens: {
          'xs': '475px',
          'sm': '640px',
          'md': '768px',
          'lg': '1024px',
          'xl': '1280px',
          '2xl': '1536px',
        },
      },
    },
    plugins: [],
  }