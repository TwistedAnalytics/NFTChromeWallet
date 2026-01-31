/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./approval.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        phantom: {
          purple: '#AB9FF2',
          'purple-dark': '#9945FF',
          'purple-darker': '#7929E8',
          bg: '#1a1625',
          'bg-light': '#2d1b3d',
          'bg-card': '#1f1529',
        }
      },
      backgroundImage: {
        'phantom-gradient': 'linear-gradient(135deg, #AB9FF2 0%, #9945FF 100%)',
      }
    },
  },
  plugins: [],
}
