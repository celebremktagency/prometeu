import React, { memo, useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
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
import { programaService } from '../services/programaService';
import { Programa } from '../types';

interface ProgramLibraryScreenProps {
  navigation: any;
}

export const ProgramLibraryScreen = memo<ProgramLibraryScreenProps>(({ navigation }) => {
  const [programs, setPrograms] = useState<Programa[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const CATEGORIAS = [
    { id: 'Hipertrofia', label: 'Hipertrofia', icon: '💪', color: colors.accent.primary },
    { id: 'Emagrecimento', label: 'Emagrecimento', icon: '🔥', color: colors.semantic.error },
    { id: 'Força', label: 'Força', icon: '🏋️', color: colors.semantic.warning },
    { id: 'Condicionamento', label: 'Condicionamento', icon: '🏃', color: colors.accent.secondary },
    { id: 'Reabilitação', label: 'Reabilitação', icon: '🏥', color: colors.semantic.info },
    { id: 'Flexibilidade', label: 'Flexibilidade', icon: '🧘', color: colors.accent.tertiary },
  ];

  const loadPrograms = useCallback(async () => {
    try {
      setLoading(true);
      
      const filtros = {
        search: searchQuery || undefined,
        categoria: selectedCategory || undefined,
      };
      
      const response = await programaService.buscarProgramas(filtros, 1, 50);
      
      if (response.data) {
        setPrograms(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar programas:', error);
      Alert.alert('Erro', 'Não foi possível carregar os programas');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPrograms();
    setRefreshing(false);
  }, [loadPrograms]);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  const handleProgramPress = useCallback((program: Programa) => {
    Haptics.selectionAsync();
    navigation.navigate('ProgramExecution', { template: program });
  }, [navigation]);

  const handleGoBack = useCallback(() => {
    Haptics.selectionAsync();
    navigation.goBack();
  }, [navigation]);

  const handleCreateProgram = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('CreateProgram');
  }, [navigation]);

  const getLevelColor = (nivel: string) => {
    switch (nivel) {
      case 'iniciante': return colors.accent.secondary;
      case 'intermediario': return colors.semantic.warning;
      case 'avancado': return colors.semantic.error;
      default: return colors.accent.primary;
    }
  };

  const getLevelIcon = (nivel: string) => {
    switch (nivel) {
      case 'iniciante': return '🟢';
      case 'intermediario': return '🟡';
      case 'avancado': return '🔴';
      default: return '⚪';
    }
  };

  const getCategoryData = (categoria: string) => {
    return CATEGORIAS.find(cat => cat.id === categoria) || {
      id: categoria,
      label: categoria,
      icon: '📋',
      color: colors.text.secondary
    };
  };

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = !searchQuery || 
      program.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.descricao?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || program.categoria === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: programs.length,
    hipertrofia: programs.filter(p => p.categoria === 'Hipertrofia').length,
    emagrecimento: programs.filter(p => p.categoria === 'Emagrecimento').length,
    forca: programs.filter(p => p.categoria === 'Força').length,
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
            Biblioteca de Programas
          </Text>
          
          <Button
            title="Criar"
            onPress={handleCreateProgram}
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
            placeholder="Buscar programas..."
            style={{ marginBottom: spacing.lg }}
          />

          {/* Stats */}
          <View style={{
            flexDirection: 'row',
            gap: spacing.sm,
            marginBottom: spacing.lg,
          }}>
            <MetricCard
              value={stats.total}
              label="Total"
              icon={<Icon name="clipboard" size={16} color={colors.accent.primary} />}
              accentColor={colors.accent.primary}
              size="sm"
              style={{ flex: 1 }}
            />
            <MetricCard
              value={stats.hipertrofia}
              label="Hipertrofia"
              icon={<Text style={{ fontSize: 14 }}>💪</Text>}
              accentColor={colors.accent.secondary}
              size="sm"
              style={{ flex: 1 }}
            />
            <MetricCard
              value={stats.emagrecimento}
              label="Emagrecimento"
              icon={<Text style={{ fontSize: 14 }}>🔥</Text>}
              accentColor={colors.semantic.error}
              size="sm"
              style={{ flex: 1 }}
            />
          </View>

          {/* Category Filter */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={[
              typography.presets.body,
              { 
                fontWeight: '600',
                marginBottom: spacing.sm,
                color: colors.text.primary 
              }
            ]}>
              Filtrar por Categoria
            </Text>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedCategory(null);
                }}
                activeOpacity={0.8}
              >
                <View style={{
                  backgroundColor: !selectedCategory 
                    ? colors.background.elevated 
                    : colors.background.secondary,
                  borderWidth: 2,
                  borderColor: !selectedCategory 
                    ? colors.accent.primary
                    : colors.surface.border,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                }}>
                  <Text style={{ fontSize: 16 }}>📋</Text>
                  <Text style={{
                    fontSize: typography.sizes.sm,
                    fontWeight: '600',
                    color: !selectedCategory ? colors.accent.primary : colors.text.primary,
                  }}>
                    Todos
                  </Text>
                </View>
              </TouchableOpacity>

              {CATEGORIAS.map((categoria) => (
                <TouchableOpacity
                  key={categoria.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedCategory(categoria.id === selectedCategory ? null : categoria.id);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={{
                    backgroundColor: selectedCategory === categoria.id 
                      ? colors.background.elevated 
                      : colors.background.secondary,
                    borderWidth: 2,
                    borderColor: selectedCategory === categoria.id 
                      ? categoria.color
                      : colors.surface.border,
                    borderRadius: borderRadius.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs,
                  }}>
                    <Text style={{ fontSize: 16 }}>
                      {categoria.icon}
                    </Text>
                    <Text style={{
                      fontSize: typography.sizes.sm,
                      fontWeight: '600',
                      color: selectedCategory === categoria.id ? categoria.color : colors.text.primary,
                    }}>
                      {categoria.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Programs List */}
          {loading ? (
            <Card variant="elevated" padding="xl" style={{ alignItems: 'center' }}>
              <Icon name="loading" size={32} color={colors.accent.primary} />
              <Text style={[
                typography.presets.body,
                { 
                  marginTop: spacing.md,
                  color: colors.text.secondary 
                }
              ]}>
                Carregando programas...
              </Text>
            </Card>
          ) : filteredPrograms.length === 0 ? (
            <Card variant="glass" padding="xl" style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 48, marginBottom: spacing.md }}>📋</Text>
              <Text style={[typography.presets.cardTitle, { marginBottom: spacing.sm }]}>
                Nenhum programa encontrado
              </Text>
              <Text style={[
                typography.presets.body,
                { 
                  textAlign: 'center',
                  color: colors.text.secondary,
                  marginBottom: spacing.lg 
                }
              ]}>
                {searchQuery || selectedCategory 
                  ? 'Tente ajustar os filtros ou criar um novo programa'
                  : 'Comece criando seu primeiro programa de treino'
                }
              </Text>
              
              <Button
                title="Criar Programa"
                onPress={handleCreateProgram}
                variant="gradient"
                size="md"
                icon={<Icon name="plus" size={16} color={colors.text.inverse} />}
              />
            </Card>
          ) : (
            <View style={{ gap: spacing.md }}>
              {filteredPrograms.map((program) => {
                const categoryData = getCategoryData(program.categoria);
                
                return (
                  <TouchableOpacity
                    key={program.id}
                    onPress={() => handleProgramPress(program)}
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
                            {program.nome}
                          </Text>
                          
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: spacing.sm,
                            marginBottom: spacing.sm,
                          }}>
                            <Text style={{ fontSize: 16 }}>
                              {categoryData.icon}
                            </Text>
                            <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
                              {categoryData.label}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={{
                          backgroundColor: getLevelColor(program.nivel),
                          paddingHorizontal: spacing.sm,
                          paddingVertical: spacing.xs,
                          borderRadius: borderRadius.sm,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing.xs,
                        }}>
                          <Text style={{ fontSize: 12 }}>
                            {getLevelIcon(program.nivel)}
                          </Text>
                          <Text style={[
                            typography.presets.caption,
                            { color: colors.text.inverse, fontWeight: '600' }
                          ]}>
                            {program.nivel?.toUpperCase() || 'INICIANTE'}
                          </Text>
                        </View>
                      </View>

                      {program.descricao && (
                        <View style={{
                          backgroundColor: colors.surface.card,
                          borderRadius: borderRadius.sm,
                          padding: spacing.sm,
                          marginBottom: spacing.sm,
                        }}>
                          <Text style={[typography.presets.body, { lineHeight: 18 }]}>
                            {program.descricao}
                          </Text>
                        </View>
                      )}

                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <View style={{ flexDirection: 'row', gap: spacing.md }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                            <Icon name="calendar" size={14} color={colors.text.tertiary} />
                            <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
                              {program.duracao_semanas || 4} sem
                            </Text>
                          </View>
                          
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                            <Icon name="repeat" size={14} color={colors.text.tertiary} />
                            <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
                              {program.frequencia_semanal || 3}x/sem
                            </Text>
                          </View>
                        </View>
                        
                        <Icon name="chevron-right" size={16} color={colors.accent.primary} />
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Espaçamento final */}
          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </LinearGradient>
    </ScreenWrapper>
  );
});

export default ProgramLibraryScreen;