import type { Config } from 'tailwindcss'

const c = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: c('bg'),
        surface: c('surface'),
        'surface-2': c('surface-2'),
        fg: c('fg'),
        muted: c('muted'),
        border: c('border'),
        accent: c('accent'),
        brand: { DEFAULT: c('brand'), fg: c('brand-fg'), soft: c('brand-soft') },
      },
      // الخط اللاتيني أولاً ثم العربي: الحروف العربية تسقط تلقائياً إلى خط Plex
      fontFamily: {
        sans: ['var(--font-latin)', 'var(--font-arabic)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        rise: { from: { transform: 'scaleY(0)' }, to: { transform: 'scaleY(1)' } },
      },
      animation: { rise: 'rise 700ms cubic-bezier(0.22, 1, 0.36, 1) both' },
    },
  },
  plugins: [],
}

export default config
