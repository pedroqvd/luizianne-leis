import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fef2f2',
          500: '#dc2626',
          700: '#991b1b',
          900: '#450a0a',
        },
      },
    },
  },
  plugins: [],
};

export default config;
