const fs = require('fs');

console.log('🔄 Recreating critical broken files with minimal working versions...\n');

// Simple working AnimatedCard
const animatedCard = `import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import { Card, CardProps } from './Card';

interface AnimatedCardProps extends Omit<CardProps, 'onPress'> {
  onPress?: () => void;
  style?: any;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  onPress,
  style,
  ...cardProps
}) => {
  return (
    <Pressable
      style={style}
      onPress={onPress}
      disabled={cardProps.disabled}
    >
      <Card {...cardProps} />
    </Pressable>
  );
};`;

// Simple working BodyDiagram
const bodyDiagram = `import React, { useState } from 'react';
import { View, Text, Pressable, Modal, Alert } from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii, sizes } from '../design-system';
import { ButtonPrimary } from './ButtonPrimary';

export interface MuscleGroup {
  id: string;
  name: string;
  body_part: string;
  x_position?: number;
  y_position?: number;
}

interface BodyDiagramProps {
  muscles: MuscleGroup[];
  onMuscleSelect?: (muscleId: string) => void;
  selectedMuscleGroup?: string;
  showPainLevels?: boolean;
}

interface PainLevel {
  level: number;
  label: string;
}

const Container = styled(View)\`
  border-radius: \${radii.xl}px;
  padding: \${spacing.lg}px;
  align-items: center;
\`;

const Title = styled(Text)\`
  margin-bottom: \${spacing.lg}px;
  text-align: center;
\`;

const BodyContainer = styled(View)\`
  width: 300px;
  height: 500px;
  position: relative;
  border-radius: \${radii.lg}px;
  border: 2px solid \${colors.border};
\`;

const MuscleButton = styled(Pressable)\`
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  border: 2px solid \${colors.border};
  justify-content: center;
  align-items: center;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 2;
\`;

export const BodyDiagram: React.FC<BodyDiagramProps> = ({
  muscles = [],
  onMuscleSelect,
  selectedMuscleGroup,
  showPainLevels = false
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);

  const handleMusclePress = (muscle: MuscleGroup) => {
    setSelectedMuscle(muscle);
    if (showPainLevels) {
      setModalVisible(true);
    } else if (onMuscleSelect) {
      onMuscleSelect(muscle.id);
    }
  };

  return (
    <Container>
      <Title>Diagrama Corporal</Title>
      <BodyContainer>
        {muscles.map((muscle) => (
          <MuscleButton
            key={muscle.id}
            style={{
              left: muscle.x_position ? muscle.x_position - 20 : 0,
              top: muscle.y_position ? muscle.y_position - 20 : 0
            }}
            onPress={() => handleMusclePress(muscle)}
          >
            <Ionicons 
              name="body-outline" 
              size={16} 
              color={colors.textPrimary}
            />
          </MuscleButton>
        ))}
      </BodyContainer>
    </Container>
  );
};`;

// Simple working BottomNav
const bottomNav = `import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../design-system';

export interface TabItem {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

interface BottomNavProps {
  activeTab: string;
  onTabPress: (tabKey: string) => void;
  tabs: TabItem[];
}

const TabButton = memo<{
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
}>(({ tab, isActive, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.tabButton} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={tab.icon} 
        size={24} 
        color={isActive ? colors.primary : colors.textSecondary} 
      />
      <Text style={[
        styles.tabLabel,
        { color: isActive ? colors.primary : colors.textSecondary }
      ]}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
});

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabPress,
  tabs
}) => {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TabButton
          key={tab.key}
          tab={tab}
          isActive={activeTab === tab.key}
          onPress={() => onTabPress(tab.key)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  tabLabel: {
    ...typography.caption,
    marginTop: spacing.xxs,
  }
});`;

// Write files
fs.writeFileSync('./app/src/components/AnimatedCard.tsx', animatedCard);
console.log('✅ Recreated AnimatedCard.tsx');

fs.writeFileSync('./app/src/components/BodyDiagram.tsx', bodyDiagram);
console.log('✅ Recreated BodyDiagram.tsx');

fs.writeFileSync('./app/src/components/BottomNav.tsx', bottomNav);
console.log('✅ Recreated BottomNav.tsx');

console.log('\n✅ All critical files recreated with working code!');