import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
 useSharedValue, 
 useAnimatedStyle, 
 withRepeat,
 withTiming,
 Easing 
} from 'react-native-reanimated';
import { colors } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { borderRadius, spacing } from '../tokens/spacing';
import { shadows } from '../tokens/shadows';
import { Icon } from './Icon';

interface StreakCardProps {
 streakDays: number;
 title?: string;
 subtitle?: string;
 animated?: boolean;
}

export const StreakCard = memo<StreakCardProps>(({
 streakDays,
 title = 'Sequência ativa',
 subtitle = 'Continue assim!',
 animated = true,
}) => {
 const scale = useSharedValue(1);

 useEffect(() => {
  if (animated) {
   scale.value = withRepeat(
    withTiming(1.05, {
     duration: 2000,
     easing: Easing.inOut(Easing.ease),
    }),
    -1,
    true
   );
  }
 }, [animated]);

 const animatedFireStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
 }));

 return (
  <LinearGradient
   colors={colors.gradients.streakFire}
   start={{ x: 0, y: 0 }}
   end={{ x: 1, y: 1 }}
   style={[styles.container, shadows.lg]}
  >
   <View style={styles.content}>
    <View style={styles.header}>
     <Animated.View style={[styles.fireIcon, animatedFireStyle]}>
      <Icon name="fire" size={32} color={colors.text.inverse} />
     </Animated.View>
     <Text style={styles.streakNumber}>{streakDays}</Text>
     <Text style={styles.daysLabel}>dias</Text>
    </View>
    
    <View style={styles.textContainer}>
     <Text style={styles.title}>{title}</Text>
     <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
   </View>
  </LinearGradient>
 );
});

const styles = StyleSheet.create({
 container: {
  borderRadius: borderRadius.xl,
  overflow: 'hidden',
  marginBottom: spacing.lg,
 },
 content: {
  padding: spacing.lg,
  flexDirection: 'row',
  alignItems: 'center',
 },
 header: {
  alignItems: 'center',
  marginRight: spacing.md,
 },
 fireIcon: {
  marginBottom: spacing.xxs,
 },
 streakNumber: {
  fontSize: 28,
  fontWeight: '700',
  color: colors.text.inverse,
  marginBottom: -4,
 },
 daysLabel: {
  fontSize: typography.sizes.sm,
  fontWeight: '600',
  color: colors.text.inverse,
  opacity: 0.8,
 },
 textContainer: {
  flex: 1,
 },
 title: {
  fontSize: typography.sizes.md,
  fontWeight: '600',
  color: colors.text.inverse,
  marginBottom: spacing.xxs,
 },
 subtitle: {
  fontSize: typography.sizes.sm,
  color: colors.text.inverse,
  opacity: 0.9,
 },
});