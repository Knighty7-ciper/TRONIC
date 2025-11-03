/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#0a0a0a',
          dark: '#1a1a1a',
          gray: '#2a2a2a',
          light: '#3a3a3a',
          red: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
          },
          white: '#ffffff',
          accent: '#dc2626',
        }
      },
      fontFamily: {
        cyber: ['Courier New', 'Monaco', 'monospace'],
        display: ['Orbitron', 'monospace'],
      },
      animation: {
        'glitch': 'glitch 0.3s ease-in-out infinite alternate',
        'pulse-red': 'pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        },
        'pulse-red': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.8' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        }
      },
      boxShadow: {
        'cyber-red': '0 0 20px rgba(220, 38, 38, 0.3)',
        'cyber-inset': 'inset 0 0 20px rgba(220, 38, 38, 0.1)',
      },
      backdropBlur: {
        cyber: '10px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    function({ addUtilities }) {
      const newUtilities = {
        '.bg-cyber-black': {
          'background-color': '#0a0a0a',
        },
        '.bg-cyber-dark': {
          'background-color': '#1a1a1a',
        },
        '.bg-cyber-gray': {
          'background-color': '#2a2a2a',
        },
        '.bg-cyber-light': {
          'background-color': '#3a3a3a',
        },
        '.bg-cyber-white': {
          'background-color': '#ffffff',
        },
        '.bg-cyber-red': {
          'background-color': '#dc2626',
        },
        '.border-cyber-black': {
          'border-color': '#0a0a0a',
        },
        '.border-cyber-dark': {
          'border-color': '#1a1a1a',
        },
        '.border-cyber-gray': {
          'border-color': '#2a2a2a',
        },
        '.border-cyber-light': {
          'border-color': '#3a3a3a',
        },
        '.border-cyber-white': {
          'border-color': '#ffffff',
        },
        '.border-cyber-red': {
          'border-color': '#dc2626',
        },
        '.text-cyber-black': {
          'color': '#0a0a0a',
        },
        '.text-cyber-dark': {
          'color': '#1a1a1a',
        },
        '.text-cyber-gray': {
          'color': '#2a2a2a',
        },
        '.text-cyber-light': {
          'color': '#3a3a3a',
        },
        '.text-cyber-white': {
          'color': '#ffffff',
        },
        '.text-cyber-red': {
          'color': '#dc2626',
        },
        '.ring-cyber-red': {
          '--tw-ring-color': '#dc2626',
        },
        '.ring-cyber-dark': {
          '--tw-ring-color': '#1a1a1a',
        },
        '.ring-cyber-gray': {
          '--tw-ring-color': '#2a2a2a',
        },
        '.font-cyber': {
          'font-family': 'Courier New, Monaco, monospace',
        }
      }
      addUtilities(newUtilities)
    }
  ],
}