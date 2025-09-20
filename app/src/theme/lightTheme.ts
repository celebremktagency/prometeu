import { colors, typography, spacing, radii, shadows } from './tokens';

export const lightTheme = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  // Theme-specific tokens for light mode
  statusBar: 'dark-content' as const,
  keyboardAppearance: 'light' as const,
};