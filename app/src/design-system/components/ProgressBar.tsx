import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
 useSharedValue, 
 useAnimatedStyle, 
 withDelay,
 withTiming,
 Easing 
} from 'react-native-reanimated';
import { colors } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { borderRadius, spacing } from '../tokens/spacing';

interface ProgressBarProps {
 label: string;
 current: number;
 total: number;
 accentColor?: string;
 animated?: boolean;
 showFraction?: boolean;
 showPercentage?: boolean;
}

export const ProgressBar = memo<ProgressBarProps>(({
 label,
 current,
 total,
 accentColor = colors.accent.primary,
 animated = true,
 showFraction = true,
 showPercentage = false,
}) => {
 const progress = useSharedValue(0);
 const opacity = useSharedValue(0);

 const percentage = Math.min((current / total) * 100, 100);
 const progressValue = Math.min(current / total, 1);

 useEffect(() => {
  if (animated) {
   progress.value = withDelay(
    200,
    withTiming(progressValue, {
     duration: 800,
     easing: Easing.out(Easing.quad),
    })
   );
   opacity.value = withTiming(1, {
    duration: 400,
    easing: Easing.ease,
   });
  } else {
   progress.value = progressValue;
   opacity.value = 1;
  }
 }, [animated, progressValue]);

 const animatedProgressStyle = useAnimatedStyle(() => ({
  width: `${progress.value * 100}%`,
  opacity: opacity.value,
 }));

 const animatedContainerStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
 }));

 const getProgressColor = () => {
  if (percentage >= 80) return colors.accent.secondary; // Green
  if (percentage >= 60) return colors.semantic.warning; // Yellow
  if (percentage >= 40) return accentColor;
  return colors.semantic.error; // Red for low progress
 };

 const progressColor = getProgressColor();

 return (
  <Animated.View style={[styles.container, animatedContainerStyle]}>
   <View style={styles.header}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.valueContainer}>
     {showFraction && (
      <Text style={[styles.fraction, { color: progressColor }]}>
       {current}/{total}
      </Text>
     )}
     {showPercentage && (
      <Text style={[styles.percentage, { color: progressColor }]}>
       {Math.round(percentage)}%
      </Text>
     )}
    </View>
   </View>
   
   <View style={styles.progressContainer}>
    <View style={styles.progressTrack}>
     <Animated.View 
      style={[
       styles.progressFill,
       { backgroundColor: progressColor },
       animatedProgressStyle
      ]} 
     />
    </View>
   </View>
  </Animated.View>
 );
});

const styles = StyleSheet.create({
 container: {
  marginBottom: spacing.md,
 },
 header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: spacing.xs,
 },
 label: {
  fontSize: typography.sizes.sm,
  fontWeight: '600',
  color: colors.text.primary,
  flex: 1,
 },
 valueContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
 },
 fraction: {
  fontSize: typography.sizes.sm,
  fontWeight: '700',
 },
 percentage: {
  fontSize: typography.sizes.sm,
  fontWeight: '700',
 },
 progressContainer: {
  width: '100%',
 },
 progressTrack: {
  height: 8,
  backgroundColor: colors.surface.border,
  borderRadius: 4,
  overflow: 'hidden',
 },
 progressFill: {
  height: '100%',
  borderRadius: 4,
  minWidth: 4,
 },
});