// Design Tokens - Main Export
import { colors } from './primitive-colors.js';
import { typography } from './typography.js';
import { spacing } from './spacing.js';
import { cornerRadius } from './corner-radius.js';
import { stroke } from './stroke.js';
import { shadows } from './shadows.js';
import { themes } from './semantic-colors.js';

// Responsive Utilities
import * as responsiveUtils from '../utils/responsive.js';

// Combine all design tokens
export const tokens = {
  colors,
  typography,
  spacing,
  cornerRadius,
  stroke,
  shadows,
  themes,
  responsive: responsiveUtils,
  // Export Tailwind-specific tokens
  fontFamily: typography.fontFamily,
  fontSize: typography.fontSize,
  fontWeight: typography.fontWeight,
  letterSpacing: typography.letterSpacing,
  lineHeight: typography.lineHeight
};

// Export individual token categories
export { colors } from './primitive-colors.js';
export { typography } from './typography.js';
export { spacing } from './spacing.js';
export { cornerRadius } from './corner-radius.js';
export { stroke } from './stroke.js';
export { shadows } from './shadows.js';
export { themes } from './semantic-colors.js';

// Export responsive utilities
export * from '../utils/responsive.js';

// Note: Theme system (ThemeProvider, useTheme, withTheme) should be imported directly from:
// import { ThemeProvider, useTheme, withTheme } from '../../services/theme-context.jsx';

// Export default tokens object
export default tokens; 