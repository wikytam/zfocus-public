import type { Config } from 'tailwindcss';

export default {
  theme: {
    extend: {
      colors: {
        'chart-1': 'hsl(var(--chart-1))',
        'chart-2': 'hsl(var(--chart-2))',
        'chart-3': 'hsl(var(--chart-3))',
        'chart-4': 'hsl(var(--chart-4))',
        'chart-5': 'hsl(var(--chart-5))',
      },
    },
  },
  plugins: [],
} as Omit<Config, 'content'>;
