import React from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import styled from 'styled-components/native';
import { colors, typography, spacing, radii, shadows } from '../theme/tokens';
import { HeaderMain } from '../components/HeaderMain';
import { ButtonPrimary } from '../components/ButtonPrimary';
import { ListItemTreino } from '../components/ListItemTreino';
import { useAuth } from '../hooks/useAuth';
import { useTreinos } from '../hooks/useTreinos';
import { Treino } from '../types/db';

interface HomeScreenProps {
  navigation: any;
}

const Container = styled(View)`
  flex: 1;
  background-color: ${colors.bg};
`;

const Content = styled(ScrollView)`
  flex: 1;
`;

const Section = styled(View)`
  padding: ${spacing.lg}px;
`;

const SectionTitle = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.h2.size}px;
  font-weight: ${typography.h2.weight};
  line-height: ${typography.h2.lineHeight}px;
  color: ${colors.textPrimary};
  margin-bottom: ${spacing.lg}px;
`;

const TreinoCard = styled(View)`
  width: 92%;
  align-self: center;
  background-color: ${colors.surface};
  border-radius: ${radii.xl}px;
  padding: ${spacing.lg}px;
  margin-bottom: ${spacing.xl}px;
  shadow-color: ${colors.shadow};
  shadow-offset: 0px 6px;
  shadow-opacity: 1;
  shadow-radius: 16px;
  elevation: 6;
  min-height: 200px;
`;

const CardHeader = styled(View)`
  margin-bottom: ${spacing.md}px;
`;

const CardTitle = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.h3.size}px;
  font-weight: ${typography.h3.weight};
  line-height: ${typography.h3.lineHeight}px;
  color: ${colors.textPrimary};
`;

const CardSubtitle = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.small.size}px;
  color: ${colors.textSecondary};
  margin-top: ${spacing.xs}px;
`;

const TreinosList = styled(View)`
  flex: 1;
  margin-bottom: ${spacing.md}px;
`;

const EmptyState = styled(View)`
  align-items: center;
  justify-content: center;
  padding: ${spacing.xl}px;
`;

const EmptyText = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.body.size}px;
  color: ${colors.textSecondary};
  text-align: center;
  margin-bottom: ${spacing.md}px;
`;

const ButtonContainer = styled(View)`
  position: absolute;
  bottom: ${spacing.lg}px;
  left: 10%;
  right: 10%;
`;

const LoadingContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

const LoadingText = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.body.size}px;
  color: ${colors.textSecondary};
  margin-top: ${spacing.md}px;
`;

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, profile, signOut } = useAuth();
  const { treinos, isLoading, markAsDone, isMarkingDone } = useTreinos(user?.id);

  const plannedTreinos = treinos.filter(treino => treino.status === 'planned');
  const todayTreinos = plannedTreinos.slice(0, 3); // Show first 3 planned workouts

  const handleStartTreino = async () => {
    if (todayTreinos.length === 0) {
      Alert.alert(
        'Nenhum treino',
        'Você não tem treinos planejados para hoje.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const firstTreino = todayTreinos[0];
      await markAsDone(firstTreino.id);
      
      Alert.alert(
        'Treino Iniciado!',
        `Treino de ${firstTreino.exercicio} marcado como concluído.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Erro',
        'Não foi possível iniciar o treino. Tente novamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleMenuPress = () => {
    Alert.alert(
      'Menu',
      'Escolha uma opção:',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const renderTreinoItem = ({ item }: { item: Treino }) => (
    <ListItemTreino
      treino={item}
      onPress={() => navigation.navigate('Training')}
    />
  );

  if (isLoading) {
    return (
      <Container>
        <HeaderMain
          userName={profile?.nome}
          onMenuPress={handleMenuPress}
        />
        <LoadingContainer>
          <LoadingText>Carregando treinos...</LoadingText>
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      <HeaderMain
        userName={profile?.nome}
        onMenuPress={handleMenuPress}
      />
      
      <Content showsVerticalScrollIndicator={false}>
        <Section>
          <SectionTitle>Treino de Hoje</SectionTitle>
          
          <TreinoCard>
            <CardHeader>
              <CardTitle>Seu Treino</CardTitle>
              <CardSubtitle>
                {todayTreinos.length === 0 
                  ? 'Nenhum treino planejado'
                  : `${todayTreinos.length} exercício${todayTreinos.length > 1 ? 's' : ''} planejado${todayTreinos.length > 1 ? 's' : ''}`
                }
              </CardSubtitle>
            </CardHeader>

            <TreinosList>
              {todayTreinos.length === 0 ? (
                <EmptyState>
                  <EmptyText>
                    Você não tem treinos planejados para hoje.
                    {'\n'}Adicione alguns exercícios na aba Treinos.
                  </EmptyText>
                </EmptyState>
              ) : (
                <FlatList
                  data={todayTreinos}
                  renderItem={renderTreinoItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </TreinosList>

            <ButtonContainer>
              <ButtonPrimary
                title={todayTreinos.length === 0 ? 'Adicionar Treino' : 'Iniciar'}
                onPress={todayTreinos.length === 0 
                  ? () => navigation.navigate('Training')
                  : handleStartTreino
                }
                loading={isMarkingDone}
                disabled={isLoading}
              />
            </ButtonContainer>
          </TreinoCard>
        </Section>
      </Content>
    </Container>
  );
};