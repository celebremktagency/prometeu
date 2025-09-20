import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, typography, spacing } from '../theme/tokens';

interface HeaderMainProps {
  title?: string;
  userName?: string;
  userAvatar?: string;
  onMenuPress?: () => void;
  onAvatarPress?: () => void;
}

interface ContainerProps {
  paddingTop: number;
}

const Container = styled(View)<ContainerProps>`
  background-color: ${colors.bg};
  padding-top: ${({ paddingTop }) => paddingTop}px;
  padding-horizontal: 20px;
  padding-bottom: ${spacing.md}px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-bottom-width: 1px;
  border-bottom-color: ${colors.cardBorder};
`;

const LeftSection = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  flex: 1;
`;

const TitleContainer = styled(View)`
  margin-left: ${spacing.md}px;
  flex: 1;
`;

const Title = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.h2.size}px;
  font-weight: ${typography.h2.weight};
  line-height: ${typography.h2.lineHeight}px;
  color: ${colors.textPrimary};
`;

const Subtitle = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.small.size}px;
  font-weight: ${typography.small.weight};
  line-height: ${typography.small.lineHeight}px;
  color: ${colors.textSecondary};
  margin-top: 2px;
`;

const AvatarContainer = styled(TouchableOpacity)`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background-color: ${colors.neutralLight};
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;

const AvatarImage = styled(Image)`
  width: 100%;
  height: 100%;
`;

const AvatarPlaceholder = styled(View)`
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  background-color: ${colors.accent};
`;

const AvatarText = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: 18px;
  font-weight: 600;
  color: #FFFFFF;
`;

export const HeaderMain: React.FC<HeaderMainProps> = ({
  title = 'Prometeus',
  userName,
  userAvatar,
  onMenuPress,
  onAvatarPress,
}) => {
  const insets = useSafeAreaInsets();
  const headerHeight = 92;
  const paddingTop = Math.max(insets.top, spacing.md);

  const getInitials = (name?: string): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <Container paddingTop={paddingTop}>
      <LeftSection onPress={onMenuPress} activeOpacity={0.7}>
        <Icon name="menu" size={22} color={colors.textPrimary} />
        <TitleContainer>
          <Title>{title}</Title>
          {userName && (
            <Subtitle>
              {getGreeting()}, {userName.split(' ')[0]}
            </Subtitle>
          )}
        </TitleContainer>
      </LeftSection>

      <AvatarContainer onPress={onAvatarPress} activeOpacity={0.8}>
        {userAvatar ? (
          <AvatarImage source={{ uri: userAvatar }} />
        ) : (
          <AvatarPlaceholder>
            <AvatarText>{getInitials(userName)}</AvatarText>
          </AvatarPlaceholder>
        )}
      </AvatarContainer>
    </Container>
  );
};