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
        // V0 neon tokens
        neon: {
          cyan: '#06b6d4',
          purple: '#7c3aed',
          pink: '#ef4444',
          green: '#22c55e',
        },
        stage: { bg: '#111128' },
        floor: { bg: '#0c0c1e' },
        bg: {
          primary: '#0f0f1a',
          secondary: '#14142b',
          card: '#1c1c35',
          hover: '#252545',
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
          DEFAULT: '#2a2845',
          bright: '#3d3a60',
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'bounce-slow': 'bounce 1s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'pulse-glow-cyan': 'pulseGlowCyan 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'vote-awesome': 'voteAwesome 0.4s ease-out',
        'vote-lame': 'voteLame 0.4s ease-out',
        'avatar-bounce': 'avatarBounce 0.6s ease-in-out',
        'avatar-shake': 'avatarShake 0.55s ease-in-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(124,58,237,0.4), 0 0 20px rgba(124,58,237,0.15)' },
          '50%': { boxShadow: '0 0 25px rgba(124,58,237,0.8), 0 0 60px rgba(124,58,237,0.3), 0 0 80px rgba(6,182,212,0.1)' },
        },
        pulseGlowCyan: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(6,182,212,0.4)' },
          '50%': { boxShadow: '0 0 25px rgba(6,182,212,0.8), 0 0 50px rgba(6,182,212,0.3)' },
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
          '0%': { transform: 'scale(1) rotate(0deg)' },
          '40%': { transform: 'scale(1.4) rotate(-12deg)' },
          '70%': { transform: 'scale(0.9) rotate(4deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' },
        },
        voteLame: {
          '0%': { transform: 'scale(1) rotate(0deg)' },
          '40%': { transform: 'scale(1.4) rotate(12deg)' },
          '70%': { transform: 'scale(0.9) rotate(-4deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' },
        },
        avatarBounce: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '30%': { transform: 'translateY(-14px) scale(1.05)' },
          '60%': { transform: 'translateY(-6px) scale(1.02)' },
          '80%': { transform: 'translateY(-2px) scale(1)' },
        },
        avatarShake: {
          '0%, 100%': { transform: 'translateX(0) rotate(0deg)' },
          '15%': { transform: 'translateX(-6px) rotate(-6deg)' },
          '30%': { transform: 'translateX(6px) rotate(6deg)' },
          '45%': { transform: 'translateX(-5px) rotate(-4deg)' },
          '60%': { transform: 'translateX(5px) rotate(4deg)' },
          '75%': { transform: 'translateX(-2px) rotate(-1deg)' },
          '90%': { transform: 'translateX(2px) rotate(1deg)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'booth-glow': 'linear-gradient(180deg, rgba(124,58,237,0.05) 0%, transparent 100%)',
      },
      boxShadow: {
        'booth': '0 0 40px rgba(124,58,237,0.2), 0 0 80px rgba(6,182,212,0.08), inset 0 1px 0 rgba(124,58,237,0.3)',
        'neon-purple': '0 0 15px rgba(124,58,237,0.5), 0 0 40px rgba(124,58,237,0.2)',
        'neon-cyan': '0 0 15px rgba(6,182,212,0.5), 0 0 40px rgba(6,182,212,0.2)',
        'vote-green': '0 0 20px rgba(16,185,129,0.4)',
        'vote-red': '0 0 20px rgba(239,68,68,0.4)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
export default config
