import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, typography, spacing } from '../theme/tokens';

interface TabItem {
  key: string;
  label: string;
  icon: string;
}

interface BottomNavProps {
  activeTab: string;
  onTabPress: (tabKey: string) => void;
  tabs: TabItem[];
}

interface ContainerProps {
  paddingBottom: number;
}

const Container = styled(View)<ContainerProps>`
  background-color: ${colors.surface};
  border-top-width: 1px;
  border-top-color: ${colors.cardBorder};
  flex-direction: row;
  padding-horizontal: ${spacing.lg}px;
  padding-top: ${spacing.md}px;
  padding-bottom: ${({ paddingBottom }) => paddingBottom}px;
`;

const TabButton = styled(TouchableOpacity)`
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  position: relative;
`;

const IconContainer = styled(View)<{ active: boolean }>`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  justify-content: center;
  align-items: center;
  background-color: ${({ active }) => active ? 'transparent' : 'transparent'};
  border-width: ${({ active }) => active ? '2px' : '0px'};
  border-color: ${({ active }) => active ? colors.accent : 'transparent'};
`;

const TabLabel = styled(Text)<{ active: boolean }>`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.caption.size}px;
  font-weight: ${typography.caption.weight};
  line-height: ${typography.caption.lineHeight}px;
  color: ${({ active }) => active ? colors.accent : colors.textSecondary};
  margin-top: ${spacing.xs}px;
`;

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabPress,
  tabs,
}) => {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, spacing.md);

  return (
    <Container paddingBottom={paddingBottom}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        
        return (
          <TabButton
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <IconContainer active={isActive}>
              <Icon
                name={tab.icon}
                size={20}
                color={isActive ? colors.accent : colors.textSecondary}
              />
            </IconContainer>
            <TabLabel active={isActive}>
              {tab.label}
            </TabLabel>
          </TabButton>
        );
      })}
    </Container>
  );
};