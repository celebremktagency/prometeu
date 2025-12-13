import React, { memo, useCallback } from 'react';
import { 
 TouchableOpacity, 
 Text, 
 StyleSheet, 
 ActivityIndicator,
 ViewStyle,
 TextStyle 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { borderRadius, spacing } from '../tokens/spacing';
import { shadows } from '../tokens/shadows';

interface ButtonProps {
 title: string;
 onPress: () => void;
 variant?: 'primary' | 'secondary' | 'ghost' | 'gradient';
 size?: 'sm' | 'md' | 'lg';
 disabled?: boolean;
 loading?: boolean;
 icon?: React.ReactNode;
 fullWidth?: boolean;
 style?: ViewStyle;
}

export const Button = memo<ButtonProps>(({
 title,
 onPress,
 variant = 'primary',
 size = 'md',
 disabled = false,
 loading = false,
 icon,
 fullWidth = false,
 style,
}) => {
 const handlePress = useCallback(() => {
  if (!disabled && !loading) {
   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
   onPress();
  }
 }, [disabled, loading, onPress]);

 const sizeStyles = {
  sm: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  md: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
 };

 const content = (
  <>
   {loading ? (
    <ActivityIndicator 
     color={variant === 'primary' ? colors.text.inverse : colors.text.primary} 
     size="small" 
    />
   ) : (
    <>
     {icon}
     <Text style={[
      styles.text,
      styles[`text_${variant}`],
      icon && { marginLeft: spacing.xs }
     ]}>
      {title}
     </Text>
    </>
   )}
  </>
 );

 if (variant === 'gradient') {
  return (
   <TouchableOpacity
    onPress={handlePress}
    disabled={disabled || loading}
    activeOpacity={0.8}
    style={[fullWidth && styles.fullWidth, style]}
   >
    <LinearGradient
     colors={colors.gradients.progress}
     start={{ x: 0, y: 0 }}
     end={{ x: 1, y: 0 }}
     style={[
      styles.base,
      sizeStyles[size],
      disabled && styles.disabled,
      shadows.glow.accent,
     ]}
    >
     {content}
    </LinearGradient>
   </TouchableOpacity>
  );
 }

 return (
  <TouchableOpacity
   onPress={handlePress}
   disabled={disabled || loading}
   activeOpacity={0.7}
   style={[
    styles.base,
    styles[variant],
    sizeStyles[size],
    disabled && styles.disabled,
    fullWidth && styles.fullWidth,
    style,
   ]}
  >
   {content}
  </TouchableOpacity>
 );
});

const styles = StyleSheet.create({
 base: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: borderRadius.lg,
 },
 fullWidth: {
  width: '100%',
 },
 primary: {
  backgroundColor: colors.accent.primary,
 },
 secondary: {
  backgroundColor: colors.background.tertiary,
  borderWidth: 1,
  borderColor: colors.surface.border,
 },
 ghost: {
  backgroundColor: 'transparent',
 },
 disabled: {
  opacity: 0.5,
 },
 text: {
  fontSize: typography.sizes.md,
  fontWeight: '600',
 },
 text_primary: {
  color: colors.text.inverse,
 },
 text_secondary: {
  color: colors.text.primary,
 },
 text_ghost: {
  color: colors.accent.primary,
 },
 text_gradient: {
  color: colors.text.inverse,
 },
});