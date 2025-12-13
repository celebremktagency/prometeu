import { Platform } from 'react-native';

export const typography = {
 fonts: {
  regular: Platform.select({ ios: 'System', android: 'Roboto' }),
  medium: Platform.select({ ios: 'System', android: 'Roboto-Medium' }),
  semibold: Platform.select({ ios: 'System', android: 'Roboto-Medium' }),
  bold: Platform.select({ ios: 'System', android: 'Roboto-Bold' }),
 },
 
 sizes: {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,
  '4xl': 42,
  hero: 56,
 },
 
 lineHeights: {
  tight: 1.1,
  normal: 1.4,
  relaxed: 1.6,
 },
 
 // Pré-definidos para uso rápido
 presets: {
  heroTitle: {
   fontSize: 42,
   fontWeight: '700' as const,
   letterSpacing: -1,
   color: '#FFFFFF',
  },
  screenTitle: {
   fontSize: 28,
   fontWeight: '700' as const,
   letterSpacing: -0.5,
   color: '#FFFFFF',
  },
  sectionTitle: {
   fontSize: 20,
   fontWeight: '600' as const,
   color: '#FFFFFF',
  },
  cardTitle: {
   fontSize: 17,
   fontWeight: '600' as const,
   color: '#FFFFFF',
  },
  body: {
   fontSize: 15,
   fontWeight: '400' as const,
   color: '#A0A0A0',
  },
  caption: {
   fontSize: 13,
   fontWeight: '400' as const,
   color: '#666666',
  },
  metric: {
   fontSize: 34,
   fontWeight: '700' as const,
   color: '#FFFFFF',
  },
  metricLabel: {
   fontSize: 13,
   fontWeight: '500' as const,
   color: '#A0A0A0',
   textTransform: 'uppercase' as const,
   letterSpacing: 0.5,
  },
 }
};