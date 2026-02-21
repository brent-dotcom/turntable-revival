import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark vinyl/DJ aesthetic
        bg: {
          primary: '#0a0a0f',
          secondary: '#12121a',
          card: '#1a1a26',
          hover: '#22223a',
        },
        accent: {
          purple: '#7c3aed',
          pink: '#ec4899',
          cyan: '#06b6d4',
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
        },
        text: {
          primary: '#f1f0ff',
          secondary: '#a89fc5',
          muted: '#6b6880',
        },
        border: {
          DEFAULT: '#2a2840',
          bright: '#3d3a5c',
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        bounce: 'bounce 0.5s ease-in-out',
        'bounce-slow': 'bounce 1s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'vote-awesome': 'voteAwesome 0.5s ease-out',
        'vote-lame': 'voteLame 0.5s ease-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(124, 58, 237, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.9), 0 0 40px rgba(124, 58, 237, 0.4)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        voteAwesome: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3) rotate(-5deg)' },
          '100%': { transform: 'scale(1)' },
        },
        voteLame: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3) rotate(5deg)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'vinyl-gradient': 'conic-gradient(from 0deg, #1a1a26, #2a2840, #1a1a26, #22223a, #1a1a26)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
export default config
