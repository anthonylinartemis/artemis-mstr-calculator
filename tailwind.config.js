/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Strategy dark theme
        'strategy-bg': '#0a0a0a',
        'strategy-card': '#141414',
        'strategy-border': '#2a2a2a',
        'strategy-orange': '#f7931a',
        'strategy-orange-dark': '#c77613',
        'strategy-green': '#22c55e',
        'strategy-red': '#ef4444',
        'strategy-yellow': '#eab308',
        'strategy-text': '#ffffff',
        'strategy-text-muted': '#9ca3af',
        // Lavender dark theme
        'lavender-bg': '#2d2a4a',
        'lavender-card': '#3d3a5a',
        'lavender-border': '#4d4a6a',
        'lavender-accent': '#9d8df1',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
