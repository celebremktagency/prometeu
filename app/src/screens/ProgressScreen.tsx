import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
} from 'react-native';
import styled from 'styled-components/native';
import { colors, typography, spacing } from '../theme/tokens';
import { HeaderMain } from '../components/HeaderMain';
import { CardInsight } from '../components/CardInsight';
import { useAuth } from '../hooks/useAuth';
import { useInsights } from '../hooks/useInsights';
import { getProgressText } from '../utils/calculations';

interface ProgressScreenProps {
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

const CardsContainer = styled(View)`
  gap: ${spacing.md}px;
`;

const LoadingContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  min-height: 300px;
`;

const LoadingText = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.body.size}px;
  color: ${colors.textSecondary};
  text-align: center;
`;

const ErrorContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: ${spacing.lg}px;
`;

const ErrorText = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.body.size}px;
  color: ${colors.danger};
  text-align: center;
  margin-bottom: ${spacing.md}px;
`;

const RetryText = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.small.size}px;
  color: ${colors.accent};
  text-align: center;
  font-weight: 600;
`;

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ navigation }) => {
  const { user, profile } = useAuth();
  const { 
    weeklyInsights, 
    isLoading, 
    error, 
    refetch 
  } = useInsights(user?.id);

  const handleRefresh = () => {
    refetch();
  };

  const handleMenuPress = () => {
    navigation.navigate('PainLevel');
  };

  if (isLoading) {
    return (
      <Container>
        <HeaderMain
          userName={profile?.nome}
          onMenuPress={handleMenuPress}
        />
        <LoadingContainer>
          <LoadingText>Carregando insights...</LoadingText>
        </LoadingContainer>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <HeaderMain
          userName={profile?.nome}
          onMenuPress={handleMenuPress}
        />
        <ErrorContainer>
          <ErrorText>
            Erro ao carregar seus dados de progresso.
            {'\n'}Verifique sua conexão e tente novamente.
          </ErrorText>
          <RetryText onPress={handleRefresh}>
            Tentar novamente
          </RetryText>
        </ErrorContainer>
      </Container>
    );
  }

  return (
    <Container>
      <HeaderMain
        userName={profile?.nome}
        onMenuPress={handleMenuPress}
      />
      
      <Content 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
      >
        <Section>
          <SectionTitle>Seus Insights</SectionTitle>
          
          <CardsContainer>
            <CardInsight
              title="Progresso Semanal"
              value={weeklyInsights?.progresso_semanal || 0}
              subtitle={getProgressText(weeklyInsights?.progresso_semanal || 0)}
              chartData={weeklyInsights?.dataset_chart}
              chartColor={colors.accent}
            />

            <CardInsight
              title="Nível de Dor"
              value={weeklyInsights?.nivel_dor?.toFixed(1) || '0.0'}
              subtitle="Média dos últimos 7 dias"
              chartData={weeklyInsights?.dataset_chart}
              chartColor={colors.danger}
            />
          </CardsContainer>
        </Section>
      </Content>
    </Container>
  );
};