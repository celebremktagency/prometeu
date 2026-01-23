import React, { memo, useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, TextInput, FlatList } from 'react-native';
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
} from '../design-system';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { programaService } from '../services/programaService';
import { treinoNovoService } from '../services/treinoNovoService';
import { supabase } from '../services/supabaseClient';
import { Treino, TreinoCompleto } from '../types';

interface CreateProgramScreenProps {
  navigation: any;
}

export const CreateProgramScreen = memo<CreateProgramScreenProps>(({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    objetivo: 'hipertrofia',
    duracao_semanas: '4',
    frequencia_semanal: '3',
    nivel: 'iniciante',
    categoria: 'Hipertrofia',
    is_publico: false,
  });

  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [treinosSelecionados, setTreinosSelecionados] = useState<{
    treino: Treino,
    dia_semana: number,
    semana: number,
    ordem: number
  }[]>([]);
  const [mostrarTreinos, setMostrarTreinos] = useState(false);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);

  const NIVEIS = [
    { id: 'iniciante', label: 'Iniciante', icon: '🟢', color: colors.accent.secondary },
    { id: 'intermediario', label: 'Intermediário', icon: '🟡', color: colors.semantic.warning },
    { id: 'avancado', label: 'Avançado', icon: '🔴', color: colors.semantic.error },
  ];

  const CATEGORIAS = [
    { id: 'Hipertrofia', label: 'Hipertrofia', icon: '💪' },
    { id: 'Emagrecimento', label: 'Emagrecimento', icon: '🔥' },
    { id: 'Força', label: 'Força', icon: '🏋️' },
    { id: 'Condicionamento', label: 'Condicionamento', icon: '🏃' },
    { id: 'Reabilitação', label: 'Reabilitação', icon: '🏥' },
    { id: 'Flexibilidade', label: 'Flexibilidade', icon: '🧘' },
  ];

  const DIAS_SEMANA = [
    { id: 1, label: 'Segunda', short: 'SEG' },
    { id: 2, label: 'Terça', short: 'TER' },
    { id: 3, label: 'Quarta', short: 'QUA' },
    { id: 4, label: 'Quinta', short: 'QUI' },
    { id: 5, label: 'Sexta', short: 'SEX' },
    { id: 6, label: 'Sábado', short: 'SAB' },
    { id: 7, label: 'Domingo', short: 'DOM' },
  ];

  // Carregar treinos disponíveis
  useEffect(() => {
    carregarTreinos();
  }, [busca]);

  const carregarTreinos = async () => {
    try {
      const response = await treinoNovoService.buscarTreinos(
        { search: busca },
        1,
        20
      );
      setTreinos(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar treinos:', error);
    }
  };

  const handleGoBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      Haptics.selectionAsync();
      navigation.goBack();
    }
  }, [currentStep, navigation]);

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      Haptics.selectionAsync();
    }
  }, [currentStep, totalSteps]);

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return formData.nome.trim() !== '' && formData.descricao.trim() !== '';
      case 2:
        return treinosSelecionados.length > 0;
      case 3:
        return true;
      default:
        return true;
    }
  };

  const updateFormData = useCallback((field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const adicionarTreino = (treino: Treino, diaSemana: number) => {
    if (treinosSelecionados.find(t => t.treino.id === treino.id && t.dia_semana === diaSemana)) {
      Alert.alert('Aviso', 'Este treino já foi adicionado para este dia');
      return;
    }

    const novoTreino = {
      treino,
      dia_semana: diaSemana,
      semana: 1, // Por enquanto só primeira semana
      ordem: treinosSelecionados.filter(t => t.dia_semana === diaSemana).length + 1
    };

    setTreinosSelecionados(prev => [...prev, novoTreino]);
    setMostrarTreinos(false);
    Haptics.selectionAsync();
  };

  const removerTreino = (index: number) => {
    setTreinosSelecionados(prev => prev.filter((_, i) => i !== index));
    Haptics.selectionAsync();
  };

  const handleSubmit = useCallback(async () => {
    if (!formData.nome.trim()) {
      Alert.alert('Erro', 'Nome do programa é obrigatório');
      return;
    }

    if (treinosSelecionados.length === 0) {
      Alert.alert('Erro', 'Adicione pelo menos um treino ao programa');
      return;
    }

    try {
      setLoading(true);

      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Erro', 'Você precisa estar logado para criar um programa');
        return;
      }

      // Criar programa
      const programaData = {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || null,
        objetivo: formData.objetivo,
        duracao_semanas: parseInt(formData.duracao_semanas) || 4,
        frequencia_semanal: parseInt(formData.frequencia_semanal) || 3,
        nivel: formData.nivel,
        categoria: formData.categoria,
        is_publico: formData.is_publico,
        criado_por: user.id,
        tags: [formData.categoria.toLowerCase(), formData.nivel]
      };

      const response = await programaService.criar(programaData);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao criar programa');
      }

      // Adicionar treinos ao programa
      for (const treino of treinosSelecionados) {
        await programaService.adicionarTreino(response.data.id, {
          treino_id: treino.treino.id,
          dia_semana: treino.dia_semana,
          semana: treino.semana,
          ordem: treino.ordem
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Sucesso!', 
        'Programa criado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', error.message || 'Não foi possível criar o programa');
    } finally {
      setLoading(false);
    }
  }, [formData, treinosSelecionados, navigation]);

  const renderInput = (
    label: string,
    field: string,
    placeholder: string,
    options?: { 
      multiline?: boolean; 
      keyboardType?: 'default' | 'numeric' | 'url';
      maxLength?: number;
    }
  ) => (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[
        typography.presets.body,
        { 
          fontWeight: '600',
          marginBottom: spacing.sm,
          color: colors.text.primary 
        }
      ]}>
        {label}
      </Text>
      
      <View style={{
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderColor: colors.surface.border,
        minHeight: options?.multiline ? 100 : 'auto',
      }}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          value={(formData as any)[field]}
          onChangeText={(text) => updateFormData(field, text)}
          style={{
            fontSize: typography.sizes.md,
            color: colors.text.primary,
            padding: 0,
            textAlignVertical: options?.multiline ? 'top' : 'center',
          }}
          multiline={options?.multiline}
          keyboardType={options?.keyboardType}
          maxLength={options?.maxLength}
        />
      </View>
    </View>
  );

  const renderSelector = (
    label: string,
    field: string,
    options: { id: string; label: string; icon: string; color?: string }[]
  ) => (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[
        typography.presets.body,
        { 
          fontWeight: '600',
          marginBottom: spacing.sm,
          color: colors.text.primary 
        }
      ]}>
        {label}
      </Text>
      
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
      }}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={() => {
              Haptics.selectionAsync();
              updateFormData(field, option.id);
            }}
            activeOpacity={0.8}
          >
            <View style={{
              backgroundColor: (formData as any)[field] === option.id 
                ? colors.background.elevated 
                : colors.background.secondary,
              borderWidth: 2,
              borderColor: (formData as any)[field] === option.id 
                ? (option.color || colors.accent.primary)
                : colors.surface.border,
              borderRadius: borderRadius.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
            }}>
              <Text style={{ fontSize: 16 }}>
                {option.icon}
              </Text>
              <Text style={{
                fontSize: typography.sizes.sm,
                fontWeight: '600',
                color: (formData as any)[field] === option.id 
                  ? (option.color || colors.accent.primary)
                  : colors.text.primary,
              }}>
                {option.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card variant="elevated" padding="lg">
            <Text style={[typography.presets.sectionTitle, { marginBottom: spacing.lg }]}>
              Informações Básicas
            </Text>

            {renderInput(
              'Nome do Programa *',
              'nome',
              'Ex: 30 Dias para Barriga Tanquinho',
              { maxLength: 100 }
            )}

            {renderInput(
              'Descrição',
              'descricao',
              'Descreva o objetivo e benefícios do programa...',
              { multiline: true, maxLength: 500 }
            )}

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                {renderInput(
                  'Duração (semanas)',
                  'duracao_semanas',
                  '4',
                  { keyboardType: 'numeric' }
                )}
              </View>
              <View style={{ flex: 1 }}>
                {renderInput(
                  'Frequência/semana',
                  'frequencia_semanal',
                  '3',
                  { keyboardType: 'numeric' }
                )}
              </View>
            </View>

            {renderSelector('Categoria', 'categoria', CATEGORIAS)}
            {renderSelector('Nível de Dificuldade', 'nivel', NIVEIS)}
          </Card>
        );

      case 2:
        return (
          <Card variant="elevated" padding="lg">
            <Text style={[typography.presets.sectionTitle, { marginBottom: spacing.lg }]}>
              Cronograma de Treinos
            </Text>

            {/* Treinos por dia da semana */}
            {DIAS_SEMANA.slice(0, parseInt(formData.frequencia_semanal) || 3).map((dia) => {
              const treinosDoDia = treinosSelecionados.filter(t => t.dia_semana === dia.id);
              
              return (
                <View key={dia.id} style={{ marginBottom: spacing.lg }}>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: spacing.sm
                  }}>
                    <Text style={[typography.presets.body, { fontWeight: '600' }]}>
                      {dia.label}
                    </Text>
                    <Button
                      title="+ Adicionar"
                      onPress={() => setMostrarTreinos(dia.id)}
                      variant="outline"
                      size="sm"
                    />
                  </View>

                  {treinosDoDia.map((item, index) => (
                    <View key={`${dia.id}-${index}`} style={{
                      backgroundColor: colors.background.secondary,
                      borderRadius: borderRadius.md,
                      padding: spacing.sm,
                      marginBottom: spacing.xs,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Text style={[typography.presets.body, { color: colors.text.primary }]}>
                        {item.treino.nome}
                      </Text>
                      <TouchableOpacity 
                        onPress={() => removerTreino(treinosSelecionados.indexOf(item))}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.semantic.error} />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {treinosDoDia.length === 0 && (
                    <View style={{
                      backgroundColor: colors.background.secondary,
                      borderRadius: borderRadius.md,
                      padding: spacing.md,
                      alignItems: 'center',
                      borderStyle: 'dashed',
                      borderWidth: 1,
                      borderColor: colors.surface.border
                    }}>
                      <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
                        Nenhum treino adicionado
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Modal de seleção de treinos */}
            {mostrarTreinos && (
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: colors.background.primary + 'DD',
                zIndex: 1000,
                padding: spacing.lg,
              }}>
                <Card variant="elevated" padding="lg" style={{ flex: 1 }}>
                  <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: spacing.md 
                  }}>
                    <Text style={[typography.presets.body, { fontWeight: '600' }]}>
                      Selecionar Treino
                    </Text>
                    <TouchableOpacity onPress={() => setMostrarTreinos(false)}>
                      <Ionicons name="close" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={{
                      backgroundColor: colors.background.secondary,
                      borderRadius: borderRadius.md,
                      padding: spacing.md,
                      marginBottom: spacing.md,
                      color: colors.text.primary
                    }}
                    placeholder="Buscar treinos..."
                    placeholderTextColor={colors.text.tertiary}
                    value={busca}
                    onChangeText={setBusca}
                  />

                  <FlatList
                    data={treinos}
                    maxToRenderPerBatch={10}
                    style={{ flex: 1 }}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => adicionarTreino(item, mostrarTreinos as number)}
                        style={{
                          backgroundColor: colors.background.secondary,
                          borderRadius: borderRadius.sm,
                          padding: spacing.md,
                          marginBottom: spacing.xs,
                          borderWidth: 1,
                          borderColor: colors.surface.border
                        }}
                      >
                        <Text style={[typography.presets.body, { fontWeight: '600', color: colors.text.primary }]}>
                          {item.nome}
                        </Text>
                        <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
                          {item.objetivo} • {item.nivel} • {item.duracao_estimada || 30}min
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </Card>
              </View>
            )}
          </Card>
        );

      case 3:
        return (
          <Card variant="elevated" padding="lg">
            <Text style={[typography.presets.sectionTitle, { marginBottom: spacing.lg }]}>
              Configurações Finais
            </Text>

            <View style={{ marginBottom: spacing.lg }}>
              <Text style={[
                typography.presets.body,
                { 
                  fontWeight: '600',
                  marginBottom: spacing.sm,
                  color: colors.text.primary 
                }
              ]}>
                Visibilidade
              </Text>
              
              <View style={{
                flexDirection: 'row',
                gap: spacing.sm,
              }}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    updateFormData('is_publico', false);
                  }}
                  activeOpacity={0.8}
                  style={{ flex: 1 }}
                >
                  <View style={{
                    backgroundColor: !formData.is_publico 
                      ? colors.background.elevated 
                      : colors.background.secondary,
                    borderWidth: 2,
                    borderColor: !formData.is_publico 
                      ? colors.accent.primary
                      : colors.surface.border,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    alignItems: 'center',
                  }}>
                    <Text style={{ fontSize: 20, marginBottom: spacing.xs }}>🔒</Text>
                    <Text style={[
                      typography.presets.body,
                      { 
                        fontWeight: '600',
                        color: !formData.is_publico ? colors.accent.primary : colors.text.primary
                      }
                    ]}>
                      Privado
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    updateFormData('is_publico', true);
                  }}
                  activeOpacity={0.8}
                  style={{ flex: 1 }}
                >
                  <View style={{
                    backgroundColor: formData.is_publico 
                      ? colors.background.elevated 
                      : colors.background.secondary,
                    borderWidth: 2,
                    borderColor: formData.is_publico 
                      ? colors.accent.primary
                      : colors.surface.border,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    alignItems: 'center',
                  }}>
                    <Text style={{ fontSize: 20, marginBottom: spacing.xs }}>🌐</Text>
                    <Text style={[
                      typography.presets.body,
                      { 
                        fontWeight: '600',
                        color: formData.is_publico ? colors.accent.primary : colors.text.primary
                      }
                    ]}>
                      Público
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Resumo do programa */}
            <View style={{
              backgroundColor: colors.background.secondary,
              borderRadius: borderRadius.md,
              padding: spacing.md,
            }}>
              <Text style={[typography.presets.body, { fontWeight: '600', marginBottom: spacing.sm }]}>
                Resumo do Programa
              </Text>
              <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
                📅 {formData.duracao_semanas} semana(s) • {formData.frequencia_semanal}x por semana
              </Text>
              <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
                🎯 {formData.categoria} • {formData.nivel}
              </Text>
              <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
                🏋️ {treinosSelecionados.length} treino(s) programado(s)
              </Text>
            </View>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <ScreenWrapper navigation={navigation} showTabBar={false}>
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary]}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: spacing.screenHorizontal,
            paddingVertical: spacing.screenVertical,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.xl,
          }}>
            <TouchableOpacity onPress={handleGoBack}>
              <Ionicons 
                name={currentStep > 1 ? "chevron-back" : "close"} 
                size={24} 
                color={colors.text.primary} 
              />
            </TouchableOpacity>
            
            <Text style={[
              typography.presets.screenTitle,
              { flex: 1, textAlign: 'center' }
            ]}>
              Criar Programa
            </Text>
            
            <View style={{ width: 24 }} />
          </View>

          {/* Progress indicator */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: spacing.xl,
            gap: spacing.sm,
          }}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <View
                key={i}
                style={{
                  width: currentStep > i + 1 ? 24 : 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: currentStep > i 
                    ? colors.accent.primary 
                    : colors.surface.border,
                }}
              />
            ))}
          </View>

          {/* Step content */}
          {renderStepContent()}

          {/* Navigation buttons */}
          <View style={{
            flexDirection: 'row',
            gap: spacing.md,
            marginTop: spacing.lg,
          }}>
            {currentStep > 1 && (
              <Button
                title="Voltar"
                onPress={handleGoBack}
                variant="secondary"
                size="lg"
                style={{ flex: 1 }}
              />
            )}
            
            {currentStep < totalSteps ? (
              <Button
                title="Próximo"
                onPress={handleNext}
                variant="gradient"
                size="lg"
                disabled={!validateCurrentStep()}
                style={{ flex: currentStep > 1 ? 1 : undefined }}
                fullWidth={currentStep === 1}
              />
            ) : (
              <Button
                title={loading ? 'Criando Programa...' : 'Criar Programa'}
                onPress={handleSubmit}
                variant="gradient"
                size="lg"
                disabled={loading || !validateCurrentStep()}
                style={{ flex: 1 }}
              />
            )}
          </View>

          {/* Espaçamento final */}
          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </LinearGradient>
    </ScreenWrapper>
  );
});