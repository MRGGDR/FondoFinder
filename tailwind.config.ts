import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Los colores UNGRD son oficiales del Manual de Identidad Visual 2024
      colors: {
        ungrd: {
          // Colores principales
          'navy':    '#213362',   // Azul oscuro principal (textos, headers)
          'yellow':  '#FFCD00',   // Amarillo institucional (acentos, CTAs)
          // Azules secundarios
          'blue-dark':  '#1B4472',
          'blue-mid':   '#07519D',
          'blue-light': '#00AEE3',
          // Paleta para tablas/cards (de claro a oscuro)
          'table-1': '#B2C9DA',
          'table-2': '#76A2BE',
          'table-3': '#3B7CA3',
          'table-4': '#1B4472',
          // Complementarios
          'orange': '#EE7C00',
          'green':  '#A8CF45',
          'gold':   '#DCA732',
          'gray':   '#6C7175',
        },
      },
      fontFamily: {
        sans: ['var(--font-nunito-sans)', 'Verdana', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '3rem',
      },
      boxShadow: {
        'primary': '0 25px 50px -12px rgba(7, 29, 76, 0.3)',
      },
    },
  },
  plugins: [],
}

export default config
