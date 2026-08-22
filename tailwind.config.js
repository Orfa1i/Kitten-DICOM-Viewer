/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kitten: {
          rust: {
            50: '#FAF0EE',
            100: '#F5DDD8',
            200: '#EBBBB2',
            300: '#E1998C',
            400: '#D77766',
            500: '#8D321F', // EXACT PRIMARY COLOR
            600: '#7E2A18',
            700: '#6E2313',
            800: '#5F1C0E',
            900: '#4F1409',
            DEFAULT: '#8D321F',
          },
          canvas: '#FDF9F9',
          cream: '#FAF6F6',
          card: '#FFFFFF',
          border: '#8D321F',
          dark: '#1B1B1E',
          charcoal: '#242426',
          green: {
            DEFAULT: '#00BF63',
            bright: '#00E676',
            glow: '#10B981',
          },
          pink: '#E85B88',
          blue: '#3B82F6',
          muted: '#8E8280',
          line: '#D2C8C6',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"League Spartan"', 'Outfit', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        spartan: ['"League Spartan"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(141, 50, 31, 0.08)',
        'modal': '0 20px 60px rgba(0, 0, 0, 0.25)',
        'glow-green': '0 0 20px rgba(0, 191, 99, 0.4)',
        'glow-rust': '0 0 25px rgba(141, 50, 31, 0.3)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      }
    },
  },
  plugins: [],
}
