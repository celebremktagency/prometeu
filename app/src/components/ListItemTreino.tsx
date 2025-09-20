import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, typography, spacing } from '../theme/tokens';
import { Treino } from '../types/db';

interface ListItemTreinoProps {
  treino: Treino;
  onPress?: () => void;
  onStatusChange?: (status: 'planned' | 'done' | 'skipped') => void;
}

const Container = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  height: 66px;
  padding-horizontal: ${spacing.md}px;
  border-bottom-width: 1px;
  border-bottom-color: ${colors.cardBorder};
`;

const IconContainer = styled(View)`
  width: 28px;
  height: 28px;
  justify-content: center;
  align-items: center;
  margin-right: ${spacing.md}px;
`;

const ContentContainer = styled(View)`
  flex: 1;
  justify-content: center;
`;

const ExercicioText = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.body.size}px;
  font-weight: ${typography.body.weight};
  line-height: ${typography.body.lineHeight}px;
  color: ${colors.textPrimary};
`;

const MetaContainer = styled(View)`
  align-items: flex-end;
  justify-content: center;
`;

const MetaText = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.small.size}px;
  font-weight: 600;
  line-height: ${typography.small.lineHeight}px;
  color: ${colors.textSecondary};
`;

const StatusIndicator = styled(View)<{ status: string }>`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${({ status }) => {
    switch (status) {
      case 'done':
        return colors.accent;
      case 'skipped':
        return colors.danger;
      default:
        return colors.textSecondary;
    }
  }};
  margin-top: ${spacing.xs}px;
`;

const getExerciseIcon = (exercicio: string): string => {
  const exerciseIcons: Record<string, string> = {
    'Agachamento': 'trending-down',
    'Flexão': 'arrow-up',
    'Abdominais': 'rotate-cw',
    'Burpee': 'zap',
    'Prancha': 'minus',
    'Polichinelo': 'user',
    'Mountain Climber': 'triangle',
  };
  
  return exerciseIcons[exercicio] || 'activity';
};

export const ListItemTreino: React.FC<ListItemTreinoProps> = ({
  treino,
  onPress,
  onStatusChange,
}) => {
  const iconName = getExerciseIcon(treino.exercicio);
  const metaText = treino.series && treino.repeticoes 
    ? `${treino.series}x${treino.repeticoes}`
    : '';

  return (
    <Container onPress={onPress} activeOpacity={0.7}>
      <IconContainer>
        <Icon 
          name={iconName} 
          size={20} 
          color={colors.textSecondary} 
        />
      </IconContainer>
      
      <ContentContainer>
        <ExercicioText>{treino.exercicio}</ExercicioText>
      </ContentContainer>
      
      <MetaContainer>
        {metaText && <MetaText>{metaText}</MetaText>}
        <StatusIndicator status={treino.status} />
      </MetaContainer>
    </Container>
  );
};