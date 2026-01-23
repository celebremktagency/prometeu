import React, { memo, useState, useCallback } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  Input,
} from '../design-system';
import { exercicioService } from '../services/exercicioService';

interface CreateExerciseScreenProps {
  navigation: any;
}

interface ExerciseForm {
  nome: string;
  descricao: string;
  grupo_muscular: string[];
  equipamento: string;
  dificuldade: 'iniciante' | 'intermediario' | 'avancado';
  mobilidade: 'musculacao' | 'cardio' | 'yoga' | 'flexibilidade';
  instrucoes: string;
  dicas_seguranca: string;
  video_url: string;
}

const gruposMusculares = [
  { id: 'peito', label: 'Peito', icon: '🫷' },
  { id: 'costas', label: 'Costas', icon: '🫸' },
  { id: 'ombros', label: 'Ombros', icon: '💪' },
  { id: 'bracos', label: 'Braços', icon: '💪' },
  { id: 'triceps', label: 'Tríceps', icon: '💪' },
  { id: 'biceps', label: 'Bíceps', icon: '💪' },
  { id: 'core', label: 'Core/Abdômen', icon: '🔥' },
  { id: 'pernas', label: 'Pernas', icon: '🦵' },
  { id: 'quadriceps', label: 'Quadríceps', icon: '🦵' },
  { id: 'posteriores', label: 'Posteriores', icon: '🦵' },
  { id: 'gluteos', label: 'Glúteos', icon: '🍑' },
  { id: 'panturrilhas', label: 'Panturrilhas', icon: '🦵' },
];

const equipamentos = [
  { id: 'peso_corporal', label: 'Peso Corporal', icon: '🤸' },
  { id: 'halteres', label: 'Halteres', icon: '🏋️' },
  { id: 'barra', label: 'Barra', icon: '🏋️' },
  { id: 'kettlebell', label: 'Kettlebell', icon: '⚖️' },
  { id: 'elasticos', label: 'Elásticos', icon: '🎯' },
  { id: 'maquina', label: 'Máquina', icon: '⚙️' },
  { id: 'cabo', label: 'Cabo', icon: '🔗' },
  { id: 'medicine_ball', label: 'Medicine Ball', icon: '⚽' },
  { id: 'trx', label: 'TRX', icon: '🎯' },
];

const dificuldades = [
  { id: 'iniciante', label: 'Iniciante', icon: '🟢', color: colors.accent.secondary },
  { id: 'intermediario', label: 'Intermediário', icon: '🟡', color: colors.semantic.warning },
  { id: 'avancado', label: 'Avançado', icon: '🔴', color: colors.semantic.error },
];

const mobilidades = [
  { id: 'musculacao', label: 'Musculação', icon: '💪' },
  { id: 'cardio', label: 'Cardio', icon: '❤️' },
  { id: 'yoga', label: 'Yoga', icon: '🧘' },
  { id: 'flexibilidade', label: 'Flexibilidade', icon: '🤸' },
];

export const CreateExerciseScreen = memo<CreateExerciseScreenProps>(({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState<ExerciseForm>({
    nome: '',
    descricao: '',
    grupo_muscular: [],
    equipamento: 'peso_corporal',
    dificuldade: 'iniciante',
    mobilidade: 'musculacao',
    instrucoes: '',
    dicas_seguranca: '',
    video_url: '',
  });

  const totalSteps = 4;

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

  const updateForm = useCallback((field: keyof ExerciseForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const toggleGrupoMuscular = useCallback((grupoId: string) => {
    setForm(prev => ({
      ...prev,
      grupo_muscular: prev.grupo_muscular.includes(grupoId)
        ? prev.grupo_muscular.filter(id => id !== grupoId)
        : [...prev.grupo_muscular, grupoId]
    }));
    Haptics.selectionAsync();
  }, []);

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return form.nome.trim() !== '' && form.descricao.trim() !== '';
      case 2:
        return form.grupo_muscular.length > 0;
      case 3:
        return true; // Equipamento e dificuldade têm valores padrão
      case 4:
        return true; // Instruções são opcionais
      default:
        return true;
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!validateCurrentStep()) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      
      const exercicioData = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim(),
        grupo_muscular: form.grupo_muscular,
        equipamento: form.equipamento,
        dificuldade: form.dificuldade,
        mobilidade: form.mobilidade,
        instrucoes: form.instrucoes.trim() || null,
        dicas_seguranca: form.dicas_seguranca.trim() || null,
        video_url: form.video_url.trim() || null,
        is_publico: true,
      };

      const response = await exercicioService.criar(exercicioData);
      if (!response.success) {
        throw new Error(response.error || 'Erro ao criar exercício');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Sucesso!',
        'Exercício criado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', error.message || 'Não foi possível criar o exercício');
    } finally {
      setLoading(false);
    }
  }, [form, navigation]);

  const renderStepIndicator = () => (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xl,
    }}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <React.Fragment key={index}>
          <View style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: index + 1 <= currentStep ? colors.accent.primary : colors.background.secondary,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: index + 1 <= currentStep ? colors.accent.primary : colors.surface.border,
          }}>
            <Text style={{
              color: index + 1 <= currentStep ? colors.text.inverse : colors.text.secondary,
              fontSize: typography.sizes.sm,
              fontWeight: '600',
            }}>
              {index + 1}
            </Text>
          </View>
          {index < totalSteps - 1 && (
            <View style={{
              width: 40,
              height: 2,
              backgroundColor: index + 1 < currentStep ? colors.accent.primary : colors.surface.border,
              marginHorizontal: spacing.xs,
            }} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderMultiSelect = (
    label: string,
    options: { id: string; label: string; icon: string; color?: string }[],
    selectedValues: string[],
    onToggle: (id: string) => void
  ) => (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[
        typography.presets.body,
        {
          fontWeight: '600',
          marginBottom: spacing.md,
          color: colors.text.primary
        }
      ]}>
        {label} *
      </Text>
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
      }}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={() => onToggle(option.id)}
            activeOpacity={0.8}
          >
            <View style={{
              backgroundColor: selectedValues.includes(option.id)
                ? colors.background.elevated
                : colors.background.secondary,
              borderWidth: 2,
              borderColor: selectedValues.includes(option.id)
                ? (option.color || colors.accent.primary)
                : colors.surface.border,
              borderRadius: borderRadius.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
            }}>
              <Text style={{ fontSize: 16 }}>{option.icon}</Text>
              <Text style={{
                fontSize: typography.sizes.sm,
                fontWeight: '600',
                color: selectedValues.includes(option.id)
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

  const renderSingleSelect = (
    label: string,
    options: { id: string; label: string; icon: string; color?: string }[],
    selectedValue: string,
    onSelect: (id: string) => void
  ) => (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[
        typography.presets.body,
        {
          fontWeight: '600',
          marginBottom: spacing.md,
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
              onSelect(option.id);
              Haptics.selectionAsync();
            }}
            activeOpacity={0.8}
          >
            <View style={{
              backgroundColor: selectedValue === option.id
                ? colors.background.elevated
                : colors.background.secondary,
              borderWidth: 2,
              borderColor: selectedValue === option.id
                ? (option.color || colors.accent.primary)
                : colors.surface.border,
              borderRadius: borderRadius.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
            }}>
              <Text style={{ fontSize: 16 }}>{option.icon}</Text>
              <Text style={{
                fontSize: typography.sizes.sm,
                fontWeight: '600',
                color: selectedValue === option.id
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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <Text style={[
              typography.presets.heading,
              { color: colors.text.primary, marginBottom: spacing.lg }
            ]}>
              Informações Básicas
            </Text>
            
            <Input
              label="Nome do Exercício *"
              placeholder="Ex: Flexão de braço, Agachamento..."
              value={form.nome}
              onChangeText={(text) => updateForm('nome', text)}
              variant="primary"
              style={{ marginBottom: spacing.lg }}
            />

            <Input
              label="Descrição *"
              placeholder="Descreva brevemente o exercício..."
              value={form.descricao}
              onChangeText={(text) => updateForm('descricao', text)}
              variant="primary"
              multiline
              numberOfLines={3}
              style={{ marginBottom: spacing.lg }}
            />
          </>
        );

      case 2:
        return (
          <>
            <Text style={[
              typography.presets.heading,
              { color: colors.text.primary, marginBottom: spacing.lg }
            ]}>
              Grupos Musculares
            </Text>
            
            {renderMultiSelect(
              'Grupos Musculares Trabalhados',
              gruposMusculares,
              form.grupo_muscular,
              toggleGrupoMuscular
            )}
          </>
        );

      case 3:
        return (
          <>
            <Text style={[
              typography.presets.heading,
              { color: colors.text.primary, marginBottom: spacing.lg }
            ]}>
              Características
            </Text>

            {renderSingleSelect(
              'Mobilidade',
              mobilidades,
              form.mobilidade,
              (value) => updateForm('mobilidade', value)
            )}

            {renderSingleSelect(
              'Equipamento',
              equipamentos,
              form.equipamento,
              (value) => updateForm('equipamento', value)
            )}

            {renderSingleSelect(
              'Dificuldade',
              dificuldades,
              form.dificuldade,
              (value) => updateForm('dificuldade', value)
            )}
          </>
        );

      case 4:
        return (
          <>
            <Text style={[
              typography.presets.heading,
              { color: colors.text.primary, marginBottom: spacing.lg }
            ]}>
              Detalhes Adicionais
            </Text>

            <Input
              label="URL do Vídeo"
              placeholder="https://youtube.com/watch?v=..."
              value={form.video_url}
              onChangeText={(text) => updateForm('video_url', text)}
              variant="primary"
              keyboardType="url"
              style={{ marginBottom: spacing.lg }}
            />

            <Input
              label="Instruções"
              placeholder="Como executar o exercício passo a passo..."
              value={form.instrucoes}
              onChangeText={(text) => updateForm('instrucoes', text)}
              variant="primary"
              multiline
              numberOfLines={4}
              style={{ marginBottom: spacing.lg }}
            />

            <Input
              label="Dicas de Segurança"
              placeholder="Cuidados importantes durante a execução..."
              value={form.dicas_seguranca}
              onChangeText={(text) => updateForm('dicas_seguranca', text)}
              variant="primary"
              multiline
              numberOfLines={3}
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
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
          paddingVertical: spacing.md,
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
            Criar Exercício
          </Text>

          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: spacing.screenHorizontal,
            paddingBottom: spacing.screenVertical,
          }}
          showsVerticalScrollIndicator={false}
        >
          {renderStepIndicator()}

          <Card variant="elevated" padding="lg">
            {renderStep()}
          </Card>
        </ScrollView>

        {/* Footer Buttons */}
        <View style={{
          paddingHorizontal: spacing.screenHorizontal,
          paddingVertical: spacing.md,
          backgroundColor: colors.background.primary,
          borderTopWidth: 1,
          borderTopColor: colors.surface.border,
        }}>
          {currentStep < totalSteps ? (
            <Button
              title="Próximo"
              onPress={handleNext}
              variant="gradient"
              size="lg"
              disabled={!validateCurrentStep()}
              icon={<Ionicons name="chevron-forward" size={20} color={colors.text.inverse} />}
            />
          ) : (
            <Button
              title={loading ? 'Criando...' : 'Criar Exercício'}
              onPress={handleSubmit}
              variant="gradient"
              size="lg"
              disabled={loading || !validateCurrentStep()}
              icon={loading ? undefined : <Ionicons name="checkmark" size={20} color={colors.text.inverse} />}
            />
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
});