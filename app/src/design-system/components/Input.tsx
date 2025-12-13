import React, { memo, useState, useCallback } from 'react';
import {
 View,
 TextInput,
 Text,
 TouchableOpacity,
 StyleSheet,
 TextInputProps,
 ViewStyle,
} from 'react-native';
import { colors } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { borderRadius, spacing } from '../tokens/spacing';
import { Icon } from './Icon';

interface InputProps extends Omit<TextInputProps, 'style'> {
 label?: string;
 error?: string;
 leftIcon?: React.ReactNode;
 rightIcon?: React.ReactNode;
 onRightIconPress?: () => void;
 variant?: 'default' | 'dark';
 style?: ViewStyle;
 showPasswordToggle?: boolean;
}

export const Input = memo<InputProps>(({
 label,
 error,
 leftIcon,
 rightIcon,
 onRightIconPress,
 variant = 'dark',
 style,
 value,
 secureTextEntry,
 showPasswordToggle = false,
 ...props
}) => {
 const [isFocused, setIsFocused] = useState(false);
 const [isPasswordVisible, setIsPasswordVisible] = useState(false);

 const handleFocus = useCallback(() => {
  setIsFocused(true);
 }, []);

 const handleBlur = useCallback(() => {
  setIsFocused(false);
 }, []);

 const togglePasswordVisibility = useCallback(() => {
  setIsPasswordVisible(!isPasswordVisible);
 }, [isPasswordVisible]);

 const shouldShowPassword = secureTextEntry && !isPasswordVisible;
 const finalRightIcon = showPasswordToggle && secureTextEntry ? (
  <TouchableOpacity onPress={togglePasswordVisibility} style={styles.iconButton}>
   <Icon 
    name={isPasswordVisible ? 'eye-off' : 'eye'} 
    size={20} 
    color={colors.text.secondary}
   />
  </TouchableOpacity>
 ) : rightIcon ? (
  <TouchableOpacity onPress={onRightIconPress} style={styles.iconButton}>
   {rightIcon}
  </TouchableOpacity>
 ) : null;

 return (
  <View style={[styles.container, style]}>
   {label && (
    <Text style={styles.label}>{label}</Text>
   )}
   
   <View style={[
    styles.inputContainer,
    styles[variant],
    isFocused && styles.focused,
    error && styles.error,
   ]}>
    {leftIcon && (
     <View style={styles.leftIconContainer}>
      {leftIcon}
     </View>
    )}
    
    <TextInput
     {...props}
     value={value}
     secureTextEntry={shouldShowPassword}
     onFocus={handleFocus}
     onBlur={handleBlur}
     style={styles.textInput}
     placeholderTextColor={colors.text.tertiary}
    />
    
    {finalRightIcon && (
     <View style={styles.rightIconContainer}>
      {finalRightIcon}
     </View>
    )}
   </View>
   
   {error && (
    <Text style={styles.errorText}>{error}</Text>
   )}
  </View>
 );
});

const styles = StyleSheet.create({
 container: {
  marginBottom: spacing.md,
 },
 label: {
  ...typography.presets.body,
  color: colors.text.secondary,
  marginBottom: spacing.xs,
 },
 inputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  borderRadius: borderRadius.lg,
  borderWidth: 1,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
 },
 default: {
  backgroundColor: colors.surface.card,
  borderColor: colors.surface.border,
 },
 dark: {
  backgroundColor: colors.background.secondary,
  borderColor: colors.surface.border,
 },
 focused: {
  borderColor: colors.accent.primary,
 },
 error: {
  borderColor: colors.semantic.error,
 },
 textInput: {
  flex: 1,
  fontSize: typography.sizes.base,
  color: colors.text.primary,
  paddingVertical: 0,
 },
 leftIconContainer: {
  marginRight: spacing.xs,
 },
 rightIconContainer: {
  marginLeft: spacing.xs,
 },
 iconButton: {
  padding: spacing.xxs,
 },
 toggleIcon: {
  fontSize: 16,
 },
 errorText: {
  ...typography.presets.caption,
  color: colors.semantic.error,
  marginTop: spacing.xxs,
 },
});