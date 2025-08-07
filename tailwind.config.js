import { colors } from './src/design-system/tokens/primitive-colors.js';
import { typography } from './src/design-system/tokens/typography.js';
import { spacing } from './src/design-system/tokens/spacing.js';
import { cornerRadius } from './src/design-system/tokens/corner-radius.js';
import { stroke } from './src/design-system/tokens/stroke.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Import design tokens
      colors: colors,
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      letterSpacing: typography.letterSpacing,
      lineHeight: typography.lineHeight,
      spacing: spacing.spacing,
      borderRadius: cornerRadius.borderRadius,
      borderWidth: {
        sm: stroke.sm,
        DEFAULT: stroke.DEFAULT,
        md: stroke.md,
        lg: stroke.lg,
        xl: stroke.xl,
        '2xl': stroke['2xl']
      },
    },
  },
  plugins: [],
} 