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

interface WeeklyCalendarProps {
 workoutDays: boolean[]; // Array de 7 booleans (Dom a Sab)
 animated?: boolean;
}

const DayDot = memo<{
 completed: boolean;
 dayLabel: string;
 index: number;
 animated: boolean;
}>(({ completed, dayLabel, index, animated }) => {
 const scale = useSharedValue(0);
 const opacity = useSharedValue(0);

 useEffect(() => {
  if (animated) {
   scale.value = withDelay(
    index * 100,
    withTiming(1, {
     duration: 400,
     easing: Easing.out(Easing.back(1.2)),
    })
   );
   opacity.value = withDelay(
    index * 100,
    withTiming(1, {
     duration: 300,
     easing: Easing.ease,
    })
   );
  } else {
   scale.value = 1;
   opacity.value = 1;
  }
 }, [animated, index]);

 const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
  opacity: opacity.value,
 }));

 return (
  <View style={styles.dayContainer}>
   <Text style={styles.dayLabel}>{dayLabel}</Text>
   <Animated.View style={[
    styles.dot,
    completed ? styles.dotCompleted : styles.dotPending,
    animatedStyle
   ]}>
    {completed && (
     <Text style={styles.checkmark}>✓</Text>
    )}
   </Animated.View>
  </View>
 );
});

export const WeeklyCalendar = memo<WeeklyCalendarProps>(({
 workoutDays,
 animated = true,
}) => {
 const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

 return (
  <View style={styles.container}>
   <Text style={styles.title}>Calendário de Treinos</Text>
   
   <View style={styles.calendar}>
    {workoutDays.map((completed, index) => (
     <DayDot
      key={index}
      completed={completed}
      dayLabel={dayLabels[index]}
      index={index}
      animated={animated}
     />
    ))}
   </View>
   
   <View style={styles.legend}>
    <View style={styles.legendItem}>
     <View style={[styles.legendDot, styles.dotCompleted]} />
     <Text style={styles.legendText}>Concluído</Text>
    </View>
    <View style={styles.legendItem}>
     <View style={[styles.legendDot, styles.dotPending]} />
     <Text style={styles.legendText}>Pendente</Text>
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
 calendar: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: spacing.md,
 },
 dayContainer: {
  alignItems: 'center',
  flex: 1,
 },
 dayLabel: {
  fontSize: typography.sizes.xs,
  color: colors.text.secondary,
  marginBottom: spacing.xs,
  fontWeight: '500',
 },
 dot: {
  width: 32,
  height: 32,
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 2,
 },
 dotCompleted: {
  backgroundColor: colors.accent.secondary,
  borderColor: colors.accent.secondary,
 },
 dotPending: {
  backgroundColor: 'transparent',
  borderColor: colors.surface.border,
 },
 checkmark: {
  color: colors.text.inverse,
  fontSize: 16,
  fontWeight: '700',
 },
 legend: {
  flexDirection: 'row',
  justifyContent: 'center',
  gap: spacing.lg,
 },
 legendItem: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
 },
 legendDot: {
  width: 12,
  height: 12,
  borderRadius: 6,
  borderWidth: 1,
 },
 legendText: {
  fontSize: typography.sizes.xs,
  color: colors.text.tertiary,
 },
});