import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { borderRadius, spacing } from '../tokens/spacing';
import { shadows } from '../tokens/shadows';
import { Button } from './Button';
import { Icon } from './Icon';

interface NextWorkoutCardProps {
 workoutName: string;
 duration: string;
 level: string;
 onStart: () => void;
 workoutType?: string;
 description?: string;
 imageUrl?: string;
}

export const NextWorkoutCard = memo<NextWorkoutCardProps>(({
 workoutName,
 duration,
 level,
 onStart,
 workoutType = 'Treino',
 description,
 imageUrl,
}) => {
 const handleStart = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  onStart();
 };

 const getLevelColor = (level: string) => {
  switch (level.toLowerCase()) {
   case 'iniciante':
    return colors.accent.secondary;
   case 'intermediário':
   case 'intermediario':
    return colors.semantic.warning;
   case 'avançado':
   case 'avancado':
    return colors.semantic.error;
   default:
    return colors.accent.primary;
  }
 };

 return (
  <View style={[styles.container, shadows.md]}>
   <LinearGradient
    colors={['rgba(228, 255, 26, 0.05)', 'transparent']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.gradient}
   >
    <View style={styles.content}>
     {/* Header */}
     <View style={styles.header}>
      <Text style={styles.sectionTitle}>Próximo Treino</Text>
     </View>

     {/* Main Content with Image Left (40%) and Info Right */}
     <View style={styles.workoutInfo}>
      {/* Left side - Image (40%) */}
      <View style={styles.leftContent}>
       {imageUrl ? (
        <Image 
         source={{ uri: imageUrl }} 
         style={styles.workoutImage}
         resizeMode="cover"
        />
       ) : (
        <View style={styles.placeholderContainer}>
         <LinearGradient
          colors={[colors.accent.primary, colors.accent.secondary]}
          style={styles.placeholderGradient}
         >
          <Icon name="workout" size={32} color={colors.background.primary} />
         </LinearGradient>
        </View>
       )}
      </View>

      {/* Right side - Info and button (60%) */}
      <View style={styles.rightContent}>
       <View style={styles.workoutDetails}>
        <Text style={styles.workoutName} numberOfLines={2}>
         {workoutName}
        </Text>
        
        <View style={styles.metaInfo}>
         <Text style={styles.duration}>{duration}</Text>
         <Text style={styles.separator}>•</Text>
         <Text style={[
          styles.level,
          { color: getLevelColor(level) }
         ]}>
          {level}
         </Text>
        </View>
        
        {description && (
         <Text style={styles.description} numberOfLines={2}>
          {description}
         </Text>
        )}

        <Button
         title="Iniciar Agora"
         onPress={handleStart}
         variant="gradient"
         size="sm"
         style={styles.startButton}
        />
       </View>
      </View>
     </View>
    </View>
   </LinearGradient>
  </View>
 );
});

const styles = StyleSheet.create({
 container: {
  backgroundColor: colors.background.secondary,
  borderRadius: borderRadius.xl,
  overflow: 'hidden',
  marginBottom: spacing.lg,
 },
 gradient: {
  flex: 1,
 },
 content: {
  padding: spacing.lg,
 },
 header: {
  marginBottom: spacing.md,
 },
 sectionTitle: {
  ...typography.presets.sectionTitle,
  marginBottom: spacing.xxs,
 },
 workoutInfo: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  minHeight: 120,
 },
 leftContent: {
  width: '40%',
  marginRight: spacing.md,
 },
 workoutImage: {
  width: '100%',
  height: '100%',
  borderRadius: borderRadius.lg,
 },
 placeholderContainer: {
  width: '100%',
  height: '100%',
  borderRadius: borderRadius.lg,
  overflow: 'hidden',
 },
 placeholderGradient: {
  width: '100%',
  height: '100%',
  alignItems: 'center',
  justifyContent: 'center',
 },
 rightContent: {
  flex: 1,
  justifyContent: 'flex-start',
 },
 workoutDetails: {
  flex: 1,
 },
 workoutName: {
  ...typography.presets.cardTitle,
  marginBottom: spacing.xs,
  lineHeight: 22,
 },
 metaInfo: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: spacing.xs,
 },
 duration: {
  fontSize: typography.sizes.sm,
  color: colors.text.secondary,
  fontWeight: '500',
 },
 separator: {
  fontSize: typography.sizes.sm,
  color: colors.text.tertiary,
  marginHorizontal: spacing.xs,
 },
 level: {
  fontSize: typography.sizes.sm,
  fontWeight: '600',
 },
 description: {
  fontSize: typography.sizes.sm,
  color: colors.text.secondary,
  lineHeight: 18,
  marginBottom: spacing.md,
 },
 startButton: {
  alignSelf: 'flex-start',
  marginTop: spacing.sm,
 },
});