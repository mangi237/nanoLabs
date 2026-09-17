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
        colors: {
          nl: {
            ink: '#0B1F1D',
            deep: '#0D3B38',
            teal: '#0F766E',
            light: '#14B8A6',
            glow: '#2DD4BF',
            blue: '#1677FF',
            mint: '#CCFBF1',
            off: '#F8FAF9',
            surface: '#FFFFFF',
            soft: '#E6F4F1',
            muted: '#6B7F7D',
            momo: '#FFCC00',
            orange: '#FF7900',
            danger: '#F43F5E',
          },
        },
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
          display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        },
        keyframes: {
          'float-slow': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-12px)' },
          },
          'float-mid': {
            '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
            '50%': { transform: 'translateY(-8px) rotate(4deg)' },
          },
          'pulse-ring': {
            '0%': { transform: 'scale(0.9)', opacity: '0.7' },
            '80%, 100%': { transform: 'scale(1.4)', opacity: '0' },
          },
          marquee: {
            '0%': { transform: 'translateX(0)' },
            '100%': { transform: 'translateX(-50%)' },
          },
          scan: {
            '0%': { transform: 'translateY(0%)' },
            '100%': { transform: 'translateY(100%)' },
          },
        },
        animation: {
          'float-slow': 'float-slow 6s ease-in-out infinite',
          'float-mid': 'float-mid 4.5s ease-in-out infinite',
          'pulse-ring': 'pulse-ring 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          marquee: 'marquee 30s linear infinite',
          scan: 'scan 2.4s ease-in-out infinite',
        },
      },
    plugins: [],
  }
}