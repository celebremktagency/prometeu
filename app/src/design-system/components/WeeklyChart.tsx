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

interface WeeklyChartProps {
 data: number[]; // Array de 7 valores (0-10)
 title: string;
 accentColor?: string;
 animated?: boolean;
}

const ChartBar = memo<{
 value: number;
 maxValue: number;
 dayLabel: string;
 index: number;
 color: string;
 animated: boolean;
}>(({ value, maxValue, dayLabel, index, color, animated }) => {
 const height = useSharedValue(0);
 const opacity = useSharedValue(0);

 const normalizedHeight = Math.max((value / maxValue) * 100, 4); // Min 4px height

 useEffect(() => {
  if (animated) {
   height.value = withDelay(
    index * 150,
    withTiming(normalizedHeight, {
     duration: 600,
     easing: Easing.out(Easing.back(1.1)),
    })
   );
   opacity.value = withDelay(
    index * 150,
    withTiming(1, {
     duration: 400,
     easing: Easing.ease,
    })
   );
  } else {
   height.value = normalizedHeight;
   opacity.value = 1;
  }
 }, [animated, index, normalizedHeight]);

 const animatedStyle = useAnimatedStyle(() => ({
  height: `${height.value}%`,
  opacity: opacity.value,
 }));

 return (
  <View style={styles.barContainer}>
   <View style={styles.barTrack}>
    <Animated.View 
     style={[
      styles.bar,
      { backgroundColor: color },
      animatedStyle
     ]} 
    />
   </View>
   <Text style={styles.dayLabel}>{dayLabel}</Text>
   <Text style={styles.valueLabel}>{value}</Text>
  </View>
 );
});

export const WeeklyChart = memo<WeeklyChartProps>(({
 data,
 title,
 accentColor = colors.accent.primary,
 animated = true,
}) => {
 const dayLabels = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
 const maxValue = Math.max(...data, 1); // Prevent division by zero

 return (
  <View style={styles.container}>
   <Text style={styles.title}>{title}</Text>
   
   <View style={styles.chartContainer}>
    <View style={styles.chart}>
     {data.map((value, index) => (
      <ChartBar
       key={index}
       value={value}
       maxValue={maxValue}
       dayLabel={dayLabels[index]}
       index={index}
       color={accentColor}
       animated={animated}
      />
     ))}
    </View>
    
    {/* Y-axis labels */}
    <View style={styles.yAxisContainer}>
     <Text style={[styles.yAxisLabel, { color: accentColor }]}>{maxValue}</Text>
     <View style={styles.yAxisSpacer} />
     <Text style={styles.yAxisLabel}>0</Text>
    </View>
   </View>
  </View>
 );
});

const styles = StyleSheet.create({
 container: {
  backgroundColor: colors.background.secondary,
  borderRadius: borderRadius.xl,
  padding: spacing.lg,
  marginBottom: spacing.lg,
 },
 title: {
  ...typography.presets.sectionTitle,
  marginBottom: spacing.md,
  textAlign: 'center',
 },
 chartContainer: {
  flexDirection: 'row',
  alignItems: 'flex-end',
 },
 chart: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'flex-end',
  height: 120,
  paddingRight: spacing.sm,
 },
 barContainer: {
  flex: 1,
  alignItems: 'center',
  height: '100%',
  justifyContent: 'flex-end',
 },
 barTrack: {
  width: '70%',
  flex: 1,
  justifyContent: 'flex-end',
  backgroundColor: colors.surface.border,
  borderRadius: 2,
  overflow: 'hidden',
  marginBottom: spacing.xs,
 },
 bar: {
  width: '100%',
  borderRadius: 2,
  minHeight: 4,
 },
 dayLabel: {
  fontSize: typography.sizes.xs,
  fontWeight: '600',
  color: colors.text.secondary,
  marginBottom: spacing.xxs,
 },
 valueLabel: {
  fontSize: typography.sizes.xs,
  fontWeight: '700',
  color: colors.text.primary,
 },
 yAxisContainer: {
  height: '100%',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: 24, // Account for day labels
 },
 yAxisLabel: {
  fontSize: typography.sizes.xs,
  fontWeight: '600',
  color: colors.text.tertiary,
 },
 yAxisSpacer: {
  flex: 1,
 },
});