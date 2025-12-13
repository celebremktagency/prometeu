import { Platform } from 'react-native';

export const shadows = {
 none: {},
 
 sm: Platform.select({
  ios: {
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 2 },
   shadowOpacity: 0.15,
   shadowRadius: 4,
  },
  android: {
   elevation: 2,
  },
 }),
 
 md: Platform.select({
  ios: {
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 4 },
   shadowOpacity: 0.2,
   shadowRadius: 8,
  },
  android: {
   elevation: 4,
  },
 }),
 
 lg: Platform.select({
  ios: {
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 8 },
   shadowOpacity: 0.25,
   shadowRadius: 16,
  },
  android: {
   elevation: 8,
  },
 }),
 
 // Glow effects para accent colors
 glow: {
  accent: Platform.select({
   ios: {
    shadowColor: '#E4FF1A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
   },
   android: {
    elevation: 8,
   },
  }),
  success: Platform.select({
   ios: {
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
   },
   android: {
    elevation: 8,
   },
  }),
 }
};