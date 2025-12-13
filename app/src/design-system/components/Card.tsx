import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../tokens/colors';
import { borderRadius, spacing } from '../tokens/spacing';
import { shadows } from '../tokens/shadows';

interface CardProps {
 children: React.ReactNode;
 variant?: 'default' | 'elevated' | 'gradient' | 'glass';
 padding?: 'none' | 'sm' | 'md' | 'lg';
 style?: ViewStyle;
}

export const Card = memo<CardProps>(({ 
 children, 
 variant = 'default',
 padding = 'md',
 style 
}) => {
 const paddingValue = {
  none: 0,
  sm: spacing.sm,
  md: spacing.cardPadding,
  lg: spacing.cardPaddingLarge,
 }[padding];

 if (variant === 'gradient') {
  return (
   <LinearGradient
    colors={colors.gradients.cardPremium}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={[
     styles.base,
     styles.gradient,
     { padding: paddingValue },
     style
    ]}
   >
    {children}
   </LinearGradient>
  );
 }

 return (
  <View style={[
   styles.base,
   styles[variant],
   { padding: paddingValue },
   style
  ]}>
   {children}
  </View>
 );
});

const styles = StyleSheet.create({
 base: {
  borderRadius: borderRadius.xl,
  overflow: 'hidden',
 },
 default: {
  backgroundColor: colors.surface.card,
  borderWidth: 1,
  borderColor: colors.surface.border,
 },
 elevated: {
  backgroundColor: colors.background.elevated,
  ...shadows.md,
 },
 gradient: {
  borderWidth: 1,
  borderColor: 'rgba(228, 255, 26, 0.2)',
 },
 glass: {
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.08)',
 },
});