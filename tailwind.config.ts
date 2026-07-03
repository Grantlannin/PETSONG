import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FBF7EF',
        ink: '#22301F',
        grass: '#2F5D3A',
        grassdeep: '#1E3F28',
        tennis: '#D7E14C',
        tennisdark: '#B8C22E',
        sky: '#7FA8C9',
        blush: '#E8D9C5',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        spinSlow: { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        bounceSm: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
      },
      animation: {
        'spin-slow': 'spinSlow 4s linear infinite',
        'bounce-sm': 'bounceSm 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
