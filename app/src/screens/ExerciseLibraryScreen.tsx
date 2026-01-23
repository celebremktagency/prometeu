import React, { memo, useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  Button,
  Card,
  MetricCard,
  Icon,
  SearchInput,
} from '../design-system';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { exercicioService } from '../services/exercicioService';
import { Exercicio } from '../types';

interface ExerciseLibraryScreenProps {
  navigation: any;
}

export const ExerciseLibraryScreen = memo<ExerciseLibraryScreenProps>(({ navigation }) => {
  const [exercises, setExercises] = useState<Exercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const MUSCLE_GROUPS = [
    { id: 'peito', label: 'Peito', icon: '💪', color: colors.accent.primary },
    { id: 'costas', label: 'Costas', icon: '🏋️', color: colors.accent.secondary },
    { id: 'pernas', label: 'Pernas', icon: '🦵', color: colors.semantic.warning },
    { id: 'ombros', label: 'Ombros', icon: '💪', color: colors.semantic.error },
    { id: 'braços', label: 'Braços', icon: '💪', color: colors.accent.tertiary },
    { id: 'abdomen', label: 'Abdome', icon: '🟡', color: colors.semantic.info },
  ];

  const loadExercises = useCallback(async () => {
    try {
      setLoading(true);
      
      const filtros = {
        search: searchQuery || undefined,
        grupo_muscular: selectedGroup ? [selectedGroup] : undefined,
      };
      
      const response = await exercicioService.buscarExercicios(filtros, 1, 100);
      
      if (response.data) {
        setExercises(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar exercícios:', error);
      Alert.alert('Erro', 'Não foi possível carregar os exercícios');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedGroup]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadExercises();
    setRefreshing(false);
  }, [loadExercises]);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  const handleExercisePress = useCallback((exercise: Exercicio) => {
    Haptics.selectionAsync();
    navigation.navigate('ExerciseDetail', { exercise });
  }, [navigation]);

  const handleGoBack = useCallback(() => {
    Haptics.selectionAsync();
    navigation.goBack();
  }, [navigation]);

  const handleCreateExercise = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('CreateExercise');
  }, [navigation]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'iniciante': return colors.accent.secondary;
      case 'intermediario': return colors.semantic.warning;
      case 'avancado': return colors.semantic.error;
      default: return colors.text.secondary;
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'iniciante': return '🟢';
      case 'intermediario': return '🟡';
      case 'avancado': return '🔴';
      default: return '⚪';
    }
  };

  const stats = {
    total: exercises.length,
    iniciante: exercises.filter(e => e.dificuldade === 'iniciante').length,
    intermediario: exercises.filter(e => e.dificuldade === 'intermediario').length,
    avancado: exercises.filter(e => e.dificuldade === 'avancado').length,
  };

  return (
    <ScreenWrapper navigation={navigation} showTabBar={false}>
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary]}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.screenHorizontal,
          paddingVertical: spacing.screenVertical,
        }}>
          <TouchableOpacity onPress={handleGoBack}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          
          <Text style={typography.presets.screenTitle}>
            Exercícios
          </Text>
          
          <Button
            title="Criar"
            onPress={handleCreateExercise}
            variant="gradient"
            size="sm"
            icon={<Icon name="plus" size={14} color={colors.text.inverse} />}
          />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: spacing.screenHorizontal,
            paddingBottom: spacing.screenVertical,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Search */}
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar exercícios..."
            style={{ marginBottom: spacing.lg }}
          />

          {/* Stats */}
          <View style={{
            flexDirection: 'row',
            gap: spacing.xs,
            marginBottom: spacing.lg,
          }}>
            <MetricCard
              value={stats.total}
              label="Total"
              icon={<Icon name="fitness" size={14} color={colors.accent.primary} />}
              accentColor={colors.accent.primary}
              size="sm"
              style={{ flex: 1 }}
            />
            <MetricCard
              value={stats.iniciante}
              label="Iniciante"
              icon={<Text style={{ fontSize: 10 }}>🟢</Text>}
              accentColor={colors.accent.secondary}
              size="sm"
              style={{ flex: 1 }}
            />
            <MetricCard
              value={stats.intermediario}
              label="Inter"
              icon={<Text style={{ fontSize: 10 }}>🟡</Text>}
              accentColor={colors.semantic.warning}
              size="sm"
              style={{ flex: 1 }}
            />
            <MetricCard
              value={stats.avancado}
              label="Avanç"
              icon={<Text style={{ fontSize: 10 }}>🔴</Text>}
              accentColor={colors.semantic.error}
              size="sm"
              style={{ flex: 1 }}
            />
          </View>

          {/* Group Filter */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={[
              typography.presets.body,
              { fontWeight: '600', marginBottom: spacing.sm, color: colors.text.primary }
            ]}>
              Grupo Muscular
            </Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedGroup(null);
                }}
                activeOpacity={0.8}
              >
                <View style={{
                  backgroundColor: !selectedGroup ? colors.background.elevated : colors.background.secondary,
                  borderWidth: 2,
                  borderColor: !selectedGroup ? colors.accent.primary : colors.surface.border,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                }}>
                  <Text style={{ fontSize: 14 }}>📋</Text>
                  <Text style={{
                    fontSize: typography.sizes.xs,
                    fontWeight: '600',
                    color: !selectedGroup ? colors.accent.primary : colors.text.primary,
                  }}>
                    Todos
                  </Text>
                </View>
              </TouchableOpacity>

              {MUSCLE_GROUPS.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedGroup(group.id === selectedGroup ? null : group.id);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={{
                    backgroundColor: selectedGroup === group.id ? colors.background.elevated : colors.background.secondary,
                    borderWidth: 2,
                    borderColor: selectedGroup === group.id ? group.color : colors.surface.border,
                    borderRadius: borderRadius.md,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs,
                  }}>
                    <Text style={{ fontSize: 14 }}>{group.icon}</Text>
                    <Text style={{
                      fontSize: typography.sizes.xs,
                      fontWeight: '600',
                      color: selectedGroup === group.id ? group.color : colors.text.primary,
                    }}>
                      {group.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Exercise List */}
          {loading ? (
            <Card variant="elevated" padding="xl" style={{ alignItems: 'center' }}>
              <Icon name="loading" size={32} color={colors.accent.primary} />
              <Text style={[typography.presets.body, { marginTop: spacing.md, color: colors.text.secondary }]}>
                Carregando exercícios...
              </Text>
            </Card>
          ) : exercises.length === 0 ? (
            <Card variant="glass" padding="xl" style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 48, marginBottom: spacing.md }}>💪</Text>
              <Text style={[typography.presets.cardTitle, { marginBottom: spacing.sm }]}>
                Nenhum exercício encontrado
              </Text>
              <Text style={[typography.presets.body, { textAlign: 'center', color: colors.text.secondary, marginBottom: spacing.lg }]}>
                {searchQuery || selectedGroup 
                  ? 'Tente ajustar os filtros ou criar um novo exercício'
                  : 'Comece criando seu primeiro exercício'
                }
              </Text>
              
              <Button
                title="Criar Exercício"
                onPress={handleCreateExercise}
                variant="gradient"
                size="md"
                icon={<Icon name="plus" size={16} color={colors.text.inverse} />}
              />
            </Card>
          ) : (
            <View style={{ gap: spacing.md }}>
              {exercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  onPress={() => handleExercisePress(exercise)}
                  activeOpacity={0.8}
                >
                  <Card variant="elevated" padding="lg">
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: spacing.sm,
                    }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.presets.cardTitle, { marginBottom: spacing.xs }]}>
                          {exercise.nome}
                        </Text>
                        
                        {exercise.grupo_muscular && exercise.grupo_muscular.length > 0 && (
                          <View style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: spacing.xs,
                            marginBottom: spacing.sm,
                          }}>
                            {exercise.grupo_muscular.slice(0, 3).map((group, index) => (
                              <View key={index} style={{
                                backgroundColor: colors.surface.card,
                                paddingHorizontal: spacing.xs,
                                paddingVertical: 2,
                                borderRadius: borderRadius.xs,
                              }}>
                                <Text style={[typography.presets.caption, { color: colors.accent.primary, fontSize: 10 }]}>
                                  {group}
                                </Text>
                              </View>
                            ))}
                            {exercise.grupo_muscular.length > 3 && (
                              <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
                                +{exercise.grupo_muscular.length - 3}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                      
                      <View style={{
                        backgroundColor: getDifficultyColor(exercise.dificuldade),
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.xs,
                        borderRadius: borderRadius.sm,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.xs,
                      }}>
                        <Text style={{ fontSize: 10 }}>
                          {getDifficultyIcon(exercise.dificuldade)}
                        </Text>
                        <Text style={[
                          typography.presets.caption,
                          { color: colors.text.inverse, fontWeight: '600', fontSize: 10 }
                        ]}>
                          {exercise.dificuldade?.toUpperCase() || 'N/A'}
                        </Text>
                      </View>
                    </View>

                    {exercise.descricao && (
                      <Text style={[
                        typography.presets.body, 
                        { lineHeight: 18, marginBottom: spacing.sm, color: colors.text.secondary }
                      ]} numberOfLines={2}>
                        {exercise.descricao}
                      </Text>
                    )}

                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        <Icon name="tool" size={12} color={colors.text.tertiary} />
                        <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
                          {exercise.equipamento || 'Peso corporal'}
                        </Text>
                      </View>
                      
                      <Icon name="chevron-right" size={16} color={colors.accent.primary} />
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </ScreenWrapper>
  );
});

export default ExerciseLibraryScreen;