/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          950: '#050B1E',
          900: '#081A3A',
          800: '#0f2744',
        },
        neon: {
          400: '#2DE2FF',
          500: '#00C2FF',
        },
        indigoGlow: {
          400: '#6B7CFF',
        },
      },
      boxShadow: {
        panel: '0 20px 60px -20px rgba(0,0,0,.7)',
        neon: '0 0 0 1px rgba(45,226,255,.25), 0 0 24px rgba(45,226,255,.22)',
        'neon-sm': '0 0 12px rgba(45,226,255,.35)',
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        glow: 'glow 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
