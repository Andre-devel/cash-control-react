import type { Config } from 'tailwindcss'
import { colors } from './src/styles/theme/colors'
import { fontFamily, fontSize } from './src/styles/theme/typography'
import { borderRadius } from './src/styles/theme/radius'
import { screens } from './src/styles/theme/breakpoints'
import { boxShadow } from './src/styles/theme/shadows'
import { spacing } from './src/styles/theme/spacing'

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors,
      fontFamily,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fontSize: fontSize as any,
      borderRadius,
      boxShadow,
      screens,
      spacing,
    },
  },
  plugins: [],
}

export default config
