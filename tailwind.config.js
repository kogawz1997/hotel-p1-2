/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' },
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        sans:    ['var(--font-sans)', 'Sarabun', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      colors: {
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        success: {
          DEFAULT:    'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        cream:    '#FAF7F2',
        espresso: '#2A2522',
        terracotta: '#C66A30',
      },
      borderRadius: {
        lg:  'var(--radius)',
        md:  'calc(var(--radius) - 2px)',
        sm:  'calc(var(--radius) - 4px)',
        xl:  'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': '24px',
      },
      boxShadow: {
        sm:  'var(--shadow-sm)',
        md:  'var(--shadow-md)',
        lg:  'var(--shadow-lg)',
        xl:  'var(--shadow-xl)',
      },
      keyframes: {
        'fade-in':  { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'slide-right': { from: { opacity: '0', transform: 'translateX(24px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        'slide-left':  { from: { opacity: '0', transform: 'translateX(-24px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        float:      { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        shimmer:    { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'ping-slow': { '0%': { transform: 'scale(1)', opacity: '1' }, '100%': { transform: 'scale(1.6)', opacity: '0' } },
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
      animation: {
        'fade-in':       'fade-in 0.5s cubic-bezier(0,0,0.2,1) both',
        'fade-in-fast':  'fade-in 0.25s cubic-bezier(0,0,0.2,1) both',
        'scale-in':      'scale-in 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
        'slide-right':   'slide-right 0.4s cubic-bezier(0,0,0.2,1) both',
        'slide-left':    'slide-left 0.4s cubic-bezier(0,0,0.2,1) both',
        float:           'float 3s ease-in-out infinite',
        shimmer:         'shimmer 1.5s ease-in-out infinite',
        'ping-slow':     'ping-slow 1.5s ease-out infinite',
        'spin-slow':     'spin 3s linear infinite',
        'accordion-down':'accordion-down 0.2s ease-out',
        'accordion-up':  'accordion-up 0.2s ease-out',
      },
      spacing: {
        safe: 'env(safe-area-inset-bottom)',
      },
      screens: {
        xs: '375px',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    require('tailwindcss/plugin')(({ addUtilities }) => {
      addUtilities({
        '.pb-safe':    { paddingBottom: 'env(safe-area-inset-bottom)' },
        '.pt-safe':    { paddingTop: 'env(safe-area-inset-top)' },
        '.text-2xs':   { fontSize: '0.625rem', lineHeight: '1rem' },
        '.scrollbar-none': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
      });
    }),
  ],
};
