import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import styled from 'styled-components/native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, typography, spacing, radii } from '../theme/tokens';
import { HeaderMain } from '../components/HeaderMain';
import { ListItemTreino } from '../components/ListItemTreino';
import { ButtonPrimary } from '../components/ButtonPrimary';
import { useAuth } from '../hooks/useAuth';
import { useTreinos } from '../hooks/useTreinos';
import { Treino } from '../types/db';

interface TrainingScreenProps {
  navigation: any;
}

const Container = styled(View)`
  flex: 1;
  background-color: ${colors.bg};
`;

const Content = styled(View)`
  flex: 1;
`;

const Section = styled(View)`
  padding: ${spacing.lg}px;
  padding-bottom: 100px;
`;

const SectionHeader = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${spacing.lg}px;
`;

const SectionTitle = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.h2.size}px;
  font-weight: ${typography.h2.weight};
  line-height: ${typography.h2.lineHeight}px;
  color: ${colors.textPrimary};
`;

const AddButton = styled(TouchableOpacity)`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: ${colors.accent};
  justify-content: center;
  align-items: center;
`;

const TreinosList = styled(View)`
  background-color: ${colors.surface};
  border-radius: ${radii.xl}px;
  overflow: hidden;
  shadow-color: ${colors.shadow};
  shadow-offset: 0px 6px;
  shadow-opacity: 1;
  shadow-radius: 16px;
  elevation: 6;
`;

const EmptyState = styled(View)`
  align-items: center;
  justify-content: center;
  padding: ${spacing.xxl}px;
`;

const EmptyText = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.body.size}px;
  color: ${colors.textSecondary};
  text-align: center;
  margin-bottom: ${spacing.md}px;
`;

const LoadingContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const LoadingText = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.body.size}px;
  color: ${colors.textSecondary};
`;

// Modal Components
const ModalOverlay = styled(View)`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  padding: ${spacing.lg}px;
`;

const ModalContent = styled(View)`
  background-color: ${colors.bg};
  border-radius: ${radii.lg}px;
  padding: ${spacing.xl}px;
  width: 100%;
  max-width: 400px;
`;

const ModalTitle = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.h3.size}px;
  font-weight: ${typography.h3.weight};
  color: ${colors.textPrimary};
  text-align: center;
  margin-bottom: ${spacing.lg}px;
`;

const InputContainer = styled(View)`
  margin-bottom: ${spacing.md}px;
`;

const Label = styled(Text)`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.small.size}px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin-bottom: ${spacing.sm}px;
`;

const Input = styled(TextInput)`
  height: 48px;
  background-color: ${colors.neutralLight};
  border-radius: ${radii.md}px;
  padding: 0 ${spacing.md}px;
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.body.size}px;
  color: ${colors.textPrimary};
`;

const ModalButtons = styled(View)`
  flex-direction: row;
  gap: ${spacing.md}px;
  margin-top: ${spacing.lg}px;
`;

const ModalButton = styled(TouchableOpacity)<{ variant?: 'primary' | 'secondary' }>`
  flex: 1;
  height: 48px;
  border-radius: ${radii.md}px;
  justify-content: center;
  align-items: center;
  background-color: ${({ variant }) => 
    variant === 'primary' ? colors.accent : colors.neutralLight
  };
`;

const ModalButtonText = styled(Text)<{ variant?: 'primary' | 'secondary' }>`
  font-family: ${typography.fontFamilyPrimary};
  font-size: ${typography.body.size}px;
  font-weight: 600;
  color: ${({ variant }) => 
    variant === 'primary' ? '#FFFFFF' : colors.textPrimary
  };
`;

export const TrainingScreen: React.FC<TrainingScreenProps> = ({ navigation }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTreino, setNewTreino] = useState({
    exercicio: '',
    series: '',
    repeticoes: '',
  });

  const { user, profile } = useAuth();
  const { 
    treinos, 
    isLoading, 
    createTreino, 
    markAsDone,
    deleteTreino,
    isCreating,
    isMarkingDone,
    isDeleting
  } = useTreinos(user?.id);

  const handleAddTreino = () => {
    setNewTreino({ exercicio: '', series: '', repeticoes: '' });
    setShowAddModal(true);
  };

  const handleSaveTreino = async () => {
    if (!newTreino.exercicio.trim()) {
      Alert.alert('Erro', 'Nome do exercício é obrigatório');
      return;
    }

    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não encontrado');
      return;
    }

    try {
      await createTreino({
        exercicio: newTreino.exercicio.trim(),
        series: parseInt(newTreino.series) || 1,
        repeticoes: newTreino.repeticoes.trim() || '10',
        status: 'planned',
      });

      setShowAddModal(false);
      setNewTreino({ exercicio: '', series: '', repeticoes: '' });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar o treino');
    }
  };

  const handleTreinoPress = (treino: Treino) => {
    Alert.alert(
      treino.exercicio,
      `Status: ${getStatusText(treino.status)}\n${treino.series}x${treino.repeticoes}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        ...(treino.status === 'planned' ? [
          {
            text: 'Marcar como feito',
            onPress: () => markAsDone(treino.id),
          }
        ] : []),
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => handleDeleteTreino(treino),
        },
      ]
    );
  };

  const handleDeleteTreino = (treino: Treino) => {
    Alert.alert(
      'Excluir Treino',
      `Tem certeza que deseja excluir "${treino.exercicio}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteTreino(treino.id),
        },
      ]
    );
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned':
        return 'Planejado';
      case 'done':
        return 'Concluído';
      case 'skipped':
        return 'Pulado';
      default:
        return status;
    }
  };

  const renderTreinoItem = ({ item }: { item: Treino }) => (
    <ListItemTreino
      treino={item}
      onPress={() => handleTreinoPress(item)}
    />
  );

  if (isLoading) {
    return (
      <Container>
        <HeaderMain
          userName={profile?.nome}
          onMenuPress={() => navigation.goBack()}
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
        onMenuPress={() => navigation.goBack()}
      />
      
      <Content>
        <Section>
          <SectionHeader>
            <SectionTitle>Meus Treinos</SectionTitle>
            <AddButton onPress={handleAddTreino} activeOpacity={0.8}>
              <Icon name="plus" size={20} color="#FFFFFF" />
            </AddButton>
          </SectionHeader>

          {treinos.length === 0 ? (
            <TreinosList>
              <EmptyState>
                <EmptyText>
                  Você ainda não tem treinos cadastrados.
                  {'\n'}Toque no botão + para adicionar seu primeiro treino.
                </EmptyText>
              </EmptyState>
            </TreinosList>
          ) : (
            <TreinosList>
              <FlatList
                data={treinos}
                renderItem={renderTreinoItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </TreinosList>
          )}
        </Section>
      </Content>

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>Novo Treino</ModalTitle>

            <InputContainer>
              <Label>Exercício</Label>
              <Input
                value={newTreino.exercicio}
                onChangeText={(text) => setNewTreino(prev => ({ ...prev, exercicio: text }))}
                placeholder="Ex: Agachamento"
                placeholderTextColor={colors.textSecondary}
              />
            </InputContainer>

            <InputContainer>
              <Label>Séries</Label>
              <Input
                value={newTreino.series}
                onChangeText={(text) => setNewTreino(prev => ({ ...prev, series: text }))}
                placeholder="3"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </InputContainer>

            <InputContainer>
              <Label>Repetições</Label>
              <Input
                value={newTreino.repeticoes}
                onChangeText={(text) => setNewTreino(prev => ({ ...prev, repeticoes: text }))}
                placeholder="10"
                placeholderTextColor={colors.textSecondary}
              />
            </InputContainer>

            <ModalButtons>
              <ModalButton
                variant="secondary"
                onPress={() => setShowAddModal(false)}
                activeOpacity={0.8}
              >
                <ModalButtonText variant="secondary">Cancelar</ModalButtonText>
              </ModalButton>

              <ModalButton
                variant="primary"
                onPress={handleSaveTreino}
                activeOpacity={0.8}
                disabled={isCreating}
              >
                <ModalButtonText variant="primary">
                  {isCreating ? 'Salvando...' : 'Salvar'}
                </ModalButtonText>
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </Container>
  );
};