import React, { memo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { borderRadius, spacing } from '../tokens/spacing';
import { shadows } from '../tokens/shadows';

interface MetricCardProps {
 value: string | number;
 label: string;
 sublabel?: string;
 icon?: React.ReactNode;
 accentColor?: string;
 size?: 'sm' | 'md' | 'lg';
 variant?: 'default' | 'gradient';
 style?: ViewStyle;
}

export const MetricCard = memo<MetricCardProps>(({
 value,
 label,
 sublabel,
 icon,
 accentColor = colors.accent.primary,
 size = 'md',
 variant = 'default',
 style,
}) => {
 const isLarge = size === 'lg';
 const isSmall = size === 'sm';
 
 if (variant === 'gradient') {
  return (
   <LinearGradient
    colors={colors.gradients.cardPremium}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={[
    styles.container, 
    isLarge && styles.containerLarge,
    isSmall && styles.containerSmall,
    shadows.sm,
    style,
   ]}>
    <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
    
    <View style={[
     styles.content,
     isLarge && styles.contentLarge,
     isSmall && styles.contentSmall,
    ]}>
     {icon && (
      <View style={[
       styles.iconContainer,
       isSmall && styles.iconContainerSmall
      ]}>
       {icon}
      </View>
     )}
     
     <Text style={[
      styles.value,
      isLarge && styles.valueLarge,
      isSmall && styles.valueSmall,
      { color: accentColor }
     ]}>
      {value}
     </Text>
     
     <Text style={[
      styles.label,
      isSmall && styles.labelSmall
     ]}>
      {label}
     </Text>
     
     {sublabel && (
      <Text style={[
       styles.sublabel,
       isSmall && styles.sublabelSmall
      ]}>
       {sublabel}
      </Text>
     )}
    </View>
   </LinearGradient>
  );
 }

 return (
  <View
   style={[
    styles.container, 
    isLarge && styles.containerLarge,
    isSmall && styles.containerSmall,
    styles.defaultBackground,
    shadows.sm,
    style,
   ]}>
   <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
   
   <View style={[
    styles.content,
    isLarge && styles.contentLarge,
    isSmall && styles.contentSmall,
   ]}>
    {icon && (
     <View style={[
      styles.iconContainer,
      isSmall && styles.iconContainerSmall
     ]}>
      {icon}
     </View>
    )}
    
    <Text style={[
     styles.value,
     isLarge && styles.valueLarge,
     isSmall && styles.valueSmall,
     { color: accentColor }
    ]}>
     {value}
    </Text>
    
    <Text style={[
     styles.label,
     isSmall && styles.labelSmall
    ]}>
     {label}
    </Text>
    
    {sublabel && (
     <Text style={[
      styles.sublabel,
      isSmall && styles.sublabelSmall
     ]}>
      {sublabel}
     </Text>
    )}
   </View>
  </View>
 );
});

const styles = StyleSheet.create({
 container: {
  borderRadius: borderRadius.xl,
  overflow: 'hidden',
  flex: 1,
  minHeight: 120,
 },
 containerLarge: {
  minHeight: 160,
 },
 containerSmall: {
  minHeight: 100,
 },
 defaultBackground: {
  backgroundColor: colors.background.secondary,
 },
 accentBar: {
  height: 3,
  width: '100%',
 },
 content: {
  padding: spacing.cardPadding,
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
 },
 contentLarge: {
  padding: spacing.cardPaddingLarge,
 },
 contentSmall: {
  padding: spacing.sm,
 },
 iconContainer: {
  marginBottom: spacing.xs,
  alignItems: 'center',
 },
 iconContainerSmall: {
  marginBottom: spacing.xxs,
 },
 value: {
  ...typography.presets.metric,
  marginBottom: spacing.xxs,
  textAlign: 'center',
 },
 valueLarge: {
  fontSize: 42,
 },
 valueSmall: {
  fontSize: 24,
 },
 label: {
  ...typography.presets.metricLabel,
  textAlign: 'center',
 },
 labelSmall: {
  fontSize: 11,
 },
 sublabel: {
  ...typography.presets.caption,
  marginTop: spacing.xxs,
  textAlign: 'center',
 },
 sublabelSmall: {
  fontSize: 10,
 },
});