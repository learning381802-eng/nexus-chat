/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        discord: {
          'blurple': '#5865F2',
          'green': '#57F287',
          'yellow': '#FEE75C',
          'fuchsia': '#EB459E',
          'red': '#ED4245',
          'white': '#FFFFFF',
          'black': '#23272A',
          'bg-primary': '#1E1F22',
          'bg-secondary': '#2B2D31',
          'bg-tertiary': '#313338',
          'bg-accent': '#404249',
          'text-normal': '#DBDEE1',
          'text-muted': '#80848E',
          'text-link': '#00AFF4',
          'header-primary': '#F2F3F5',
          'header-secondary': '#B5BAC1',
          'interactive-normal': '#B5BAC1',
          'interactive-hover': '#DBDEE1',
          'interactive-active': '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['gg sans', 'Noto Sans', 'Whitney', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
