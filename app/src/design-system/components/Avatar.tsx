import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../tokens/colors';
import { borderRadius, spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';

interface AvatarProps {
 size?: 'sm' | 'md' | 'lg';
 name?: string;
 onPress?: () => void;
 showBorder?: boolean;
}

export const Avatar = memo<AvatarProps>(({
 size = 'md',
 name = 'U',
 onPress,
 showBorder = true,
}) => {
 const sizeConfig = {
  sm: { size: 32, fontSize: 14, borderWidth: 1 },
  md: { size: 48, fontSize: 20, borderWidth: 2 },
  lg: { size: 80, fontSize: 32, borderWidth: 3 },
 };

 const config = sizeConfig[size];
 const initials = name
  .split(' ')
  .map(n => n[0])
  .join('')
  .toUpperCase()
  .slice(0, 2);

 const AvatarContent = () => (
  <View style={[
   styles.container,
   {
    width: config.size,
    height: config.size,
    borderRadius: config.size / 2,
   }
  ]}>
   <Text style={[
    styles.text,
    { fontSize: config.fontSize }
   ]}>
    {initials}
   </Text>
  </View>
 );

 if (showBorder) {
  const BorderWrapper = () => (
   <LinearGradient
    colors={colors.gradients.progress}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={[
     styles.borderContainer,
     {
      width: config.size + config.borderWidth * 2,
      height: config.size + config.borderWidth * 2,
      borderRadius: (config.size + config.borderWidth * 2) / 2,
      padding: config.borderWidth,
     }
    ]}
   >
    <AvatarContent />
   </LinearGradient>
  );

  return onPress ? (
   <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
    <BorderWrapper />
   </TouchableOpacity>
  ) : (
   <BorderWrapper />
  );
 }

 return onPress ? (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
   <AvatarContent />
  </TouchableOpacity>
 ) : (
  <AvatarContent />
 );
});

const styles = StyleSheet.create({
 borderContainer: {
  alignItems: 'center',
  justifyContent: 'center',
 },
 container: {
  backgroundColor: colors.background.elevated,
  alignItems: 'center',
  justifyContent: 'center',
 },
 text: {
  color: colors.accent.primary,
  fontWeight: '700',
 },
});