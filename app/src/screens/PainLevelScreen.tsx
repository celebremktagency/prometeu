import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import styled from 'styled-components/native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, typography, spacing, radii } from '../theme/tokens';
import { SliderPain } from '../components/SliderPain';
import { ButtonPrimary } from '../components/ButtonPrimary';
import { useAuth } from '../hooks/useAuth';
import { useInsights } from '../hooks/useInsights';
import { getPainLevelText } from '../utils/calculations';

interface PainLevelScreenProps {
  navigation: any;
}

interface Muscle {
  id: string;
  name: string;
  selected: boolean;
}

const Container = styled(View)`
  flex: 1;
  background-color: ${colors.bg};
`;

const Header = styled(View)`
  padding: ${spacing.lg}px;
  padding-top: ${spacing.xl}px;
  border-bottom-width: 1px;
  border-bottom-color: ${colors.cardBorder};
`;

const Title = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.h1.size}px;
  font-weight: ${typography.h1.weight};
  line-height: ${typography.h1.lineHeight}px;
  color: ${colors.textPrimary};
  text-align: center;
  margin-bottom: ${spacing.sm}px;
`;

const Subtitle = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.body.size}px;
  color: ${colors.textSecondary};
  text-align: center;
`;

const Content = styled(ScrollView)`
  flex: 1;
`;

const LeftColumn = styled(View)`
  flex: 1;
  padding: ${spacing.lg}px;
`;

const RightColumn = styled(View)`
  width: 50%;
  justify-content: center;
  align-items: center;
  padding: ${spacing.lg}px;
`;

const Row = styled(View)`
  flex-direction: row;
`;

const SliderSection = styled(View)`
  margin-bottom: ${spacing.xl}px;
`;

const SliderLabel = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.h3.size}px;
  font-weight: ${typography.h3.weight};
  color: ${colors.textPrimary};
  margin-bottom: ${spacing.sm}px;
`;

const PainLevelText = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.body.size}px;
  color: ${colors.textSecondary};
  margin-bottom: ${spacing.lg}px;
  text-align: center;
`;

const MuscleSection = styled(View)`
  margin-bottom: ${spacing.xl}px;
`;

const SectionTitle = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.h3.size}px;
  font-weight: ${typography.h3.weight};
  color: ${colors.textPrimary};
  margin-bottom: ${spacing.md}px;
`;

const MuscleItem = styled(TouchableOpacity)<{ selected: boolean }>`
  height: 72px;
  border-radius: ${radii.md}px;
  border-width: 1px;
  border-color: ${({ selected }) => selected ? colors.accent : colors.cardBorder};
  background-color: ${({ selected }) => 
    selected ? 'rgba(6, 199, 195, 0.06)' : colors.bg
  };
  flex-direction: row;
  align-items: center;
  padding: 0 ${spacing.md}px;
  margin-bottom: ${spacing.sm}px;
`;

const MuscleIndicator = styled(View)<{ selected: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: ${({ selected }) => 
    selected ? colors.accent : colors.neutralLight
  };
  justify-content: center;
  align-items: center;
  margin-right: ${spacing.md}px;
`;

const MuscleText = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: 18px;
  font-weight: 600;
  color: ${colors.textPrimary};
  flex: 1;
`;

const HumanSilhouette = styled(View)`
  width: 150px;
  height: 300px;
  background-color: ${colors.neutralLight};
  border-radius: ${radii.lg}px;
  justify-content: center;
  align-items: center;
  border-width: 2px;
  border-color: ${colors.cardBorder};
`;

const SilhouetteText = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.small.size}px;
  color: ${colors.textSecondary};
  text-align: center;
`;

const ButtonContainer = styled(View)`
  padding: ${spacing.lg}px;
  padding-bottom: ${spacing.xl}px;
`;

const MUSCLES: Muscle[] = [
  { id: 'biceps', name: 'Bíceps', selected: false },
  { id: 'triceps', name: 'Tríceps', selected: false },
  { id: 'ombros', name: 'Ombros', selected: false },
  { id: 'peito', name: 'Peito', selected: false },
  { id: 'costas', name: 'Costas', selected: false },
  { id: 'abdomen', name: 'Abdômen', selected: false },
  { id: 'quadriceps', name: 'Quadríceps', selected: false },
  { id: 'panturrilha', name: 'Panturrilha', selected: false },
  { id: 'gluteos', name: 'Glúteos', selected: false },
];

export const PainLevelScreen: React.FC<PainLevelScreenProps> = ({ navigation }) => {
  const [painLevel, setPainLevel] = useState(0);
  const [muscles, setMuscles] = useState<Muscle[]>(MUSCLES);
  
  const { user } = useAuth();
  const { recordDor, isRecordingDor } = useInsights(user?.id);

  const selectedMuscles = muscles.filter(muscle => muscle.selected);

  const toggleMuscle = (muscleId: string) => {
    setMuscles(prev => 
      prev.map(muscle => 
        muscle.id === muscleId 
          ? { ...muscle, selected: !muscle.selected }
          : muscle
      )
    );
  };

  const handleSubmit = async () => {
    if (selectedMuscles.length === 0) {
      Alert.alert(
        'Selecione um músculo',
        'Por favor, selecione pelo menos um músculo para registrar a dor.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não encontrado');
      return;
    }

    try {
      // Record pain for each selected muscle
      for (const muscle of selectedMuscles) {
        await recordDor({
          usuarioId: user.id,
          musculo: muscle.name,
          nivel: painLevel,
        });
      }

      Alert.alert(
        'Registrado com sucesso!',
        `Nível de dor ${painLevel.toFixed(1)} registrado para ${selectedMuscles.length} músculo${selectedMuscles.length > 1 ? 's' : ''}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setPainLevel(0);
              setMuscles(MUSCLES);
              // Navigate to Progress to see the updated chart
              navigation.navigate('Progress');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Erro',
        'Não foi possível registrar a dor. Tente novamente.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <Container>
      <Header>
        <Title>Registro de Dor</Title>
        <Subtitle>Avalie sua dor em uma escala de 0 a 10</Subtitle>
      </Header>

      <Content showsVerticalScrollIndicator={false}>
        <Row>
          <LeftColumn>
            <SliderSection>
              <SliderLabel>Nível de Dor</SliderLabel>
              <PainLevelText>{getPainLevelText(painLevel)}</PainLevelText>
              <SliderPain
                value={painLevel}
                onValueChange={setPainLevel}
                min={0}
                max={10}
                step={0.5}
              />
            </SliderSection>

            <MuscleSection>
              <SectionTitle>Selecione os músculos</SectionTitle>
              {muscles.map((muscle) => (
                <MuscleItem
                  key={muscle.id}
                  selected={muscle.selected}
                  onPress={() => toggleMuscle(muscle.id)}
                  activeOpacity={0.7}
                >
                  <MuscleIndicator selected={muscle.selected}>
                    {muscle.selected ? (
                      <Icon name="check" size={16} color="#FFFFFF" />
                    ) : null}
                  </MuscleIndicator>
                  <MuscleText>{muscle.name}</MuscleText>
                </MuscleItem>
              ))}
            </MuscleSection>
          </LeftColumn>

          <RightColumn>
            <HumanSilhouette>
              <SilhouetteText>
                Silhueta{'\n'}Humana{'\n'}(Placeholder)
              </SilhouetteText>
            </HumanSilhouette>
          </RightColumn>
        </Row>
      </Content>

      <ButtonContainer>
        <ButtonPrimary
          title="Próximo"
          onPress={handleSubmit}
          loading={isRecordingDor}
          disabled={selectedMuscles.length === 0 || painLevel === 0}
        />
      </ButtonContainer>
    </Container>
  );
};