import React, { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
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

interface PostWorkoutAssessmentProps {
  visible: boolean;
  onComplete: (assessment: PostWorkoutData) => void;
  onCancel: () => void;
}

export interface PostWorkoutData {
  discomfortLevel: number; // 1-10 scale
  effortPerceptionRpe: number; // 6-20 traditional RPE scale or 1-10 simplified
  overallSatisfaction: number; // 1-10 scale
  notes?: string;
}

const ScaleSelector = memo<{
  title: string;
  subtitle?: string;
  value: number;
  onChange: (value: number) => void;
  minValue: number;
  maxValue: number;
  minLabel: string;
  maxLabel: string;
  color?: string;
  descriptions?: string[];
}>(({ title, subtitle, value, onChange, minValue, maxValue, minLabel, maxLabel, color = colors.accent.primary, descriptions }) => (
  <View style={{ marginBottom: spacing.lg }}>
    <Text style={[
      typography.presets.body,
      { fontWeight: '600', marginBottom: spacing.xs, color: colors.text.primary }
    ]}>
      {title}
    </Text>
    
    {subtitle && (
      <Text style={[
        typography.presets.caption,
        { marginBottom: spacing.sm, color: colors.text.secondary }
      ]}>
        {subtitle}
      </Text>
    )}
    
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    }}>
      <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
        {minLabel}
      </Text>
      <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
        {maxLabel}
      </Text>
    </View>
    
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    }}>
      {Array.from({ length: maxValue - minValue + 1 }, (_, i) => minValue + i).map((num) => (
        <TouchableOpacity
          key={num}
          onPress={() => {
            Haptics.selectionAsync();
            onChange(num);
          }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: value === num ? color : colors.background.secondary,
            borderWidth: 2,
            borderColor: value === num ? color : colors.surface.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: value === num ? colors.text.inverse : colors.text.primary,
          }}>
            {num}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
    
    <View style={{
      backgroundColor: colors.background.elevated,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      alignItems: 'center',
    }}>
      <Text style={[
        typography.presets.body,
        { fontWeight: '600', color: color }
      ]}>
        {value} - {descriptions && descriptions[value - minValue] ? descriptions[value - minValue] : 'Selecionado'}
      </Text>
    </View>
  </View>
));

const SatisfactionSelector = memo<{
  value: number;
  onChange: (value: number) => void;
}>(({ value, onChange }) => {
  const satisfactionOptions = [
    { value: 1, emoji: '😫', label: 'Péssimo', color: colors.semantic.error },
    { value: 2, emoji: '😞', label: 'Muito ruim', color: colors.semantic.error },
    { value: 3, emoji: '😔', label: 'Ruim', color: colors.semantic.warning },
    { value: 4, emoji: '😐', label: 'Regular', color: colors.semantic.warning },
    { value: 5, emoji: '🙂', label: 'Bom', color: colors.accent.secondary },
    { value: 6, emoji: '😊', label: 'Muito bom', color: colors.accent.primary },
    { value: 7, emoji: '😄', label: 'Excelente', color: colors.accent.primary },
  ];

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[
        typography.presets.body,
        { fontWeight: '600', marginBottom: spacing.sm, color: colors.text.primary }
      ]}>
        Como você se sente em relação ao treino?
      </Text>
      
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        justifyContent: 'space-between',
      }}>
        {satisfactionOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(option.value);
            }}
            style={{
              backgroundColor: value === option.value 
                ? option.color + '20' 
                : colors.background.secondary,
              borderWidth: 2,
              borderColor: value === option.value 
                ? option.color 
                : colors.surface.border,
              borderRadius: borderRadius.md,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.xs,
              alignItems: 'center',
              minWidth: 80,
              flex: 1,
              margin: 2,
            }}
          >
            <Text style={{ fontSize: 24, marginBottom: spacing.xxs }}>
              {option.emoji}
            </Text>
            <Text style={{
              fontSize: typography.sizes.xs,
              fontWeight: '600',
              textAlign: 'center',
              color: value === option.value 
                ? option.color 
                : colors.text.primary,
            }}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {value > 0 && (
        <View style={{
          backgroundColor: colors.background.elevated,
          borderRadius: borderRadius.md,
          padding: spacing.sm,
          marginTop: spacing.sm,
          alignItems: 'center',
        }}>
          <Text style={[
            typography.presets.body,
            { fontWeight: '600', color: satisfactionOptions.find(o => o.value === value)?.color || colors.accent.primary }
          ]}>
            Satisfação: {satisfactionOptions.find(o => o.value === value)?.label}
          </Text>
        </View>
      )}
    </View>
  );
});

export const PostWorkoutAssessment = memo<PostWorkoutAssessmentProps>(({
  visible,
  onComplete,
  onCancel,
}) => {
  const [discomfortLevel, setDiscomfortLevel] = useState(1);
  const [effortPerceptionRpe, setEffortPerceptionRpe] = useState(5);
  const [overallSatisfaction, setOverallSatisfaction] = useState(0);

  const resetState = useCallback(() => {
    setDiscomfortLevel(1);
    setEffortPerceptionRpe(5);
    setOverallSatisfaction(0);
  }, []);

  const handleCancel = useCallback(() => {
    resetState();
    onCancel();
  }, [resetState, onCancel]);

  const handleComplete = useCallback(() => {
    if (overallSatisfaction === 0) {
      Alert.alert('Atenção', 'Por favor, avalie sua satisfação com o treino.');
      return;
    }

    const assessmentData: PostWorkoutData = {
      discomfortLevel,
      effortPerceptionRpe,
      overallSatisfaction,
      notes: `Post-workout assessment: Discomfort ${discomfortLevel}/10, Effort ${effortPerceptionRpe}/10, Satisfaction ${overallSatisfaction}/7`
    };

    onComplete(assessmentData);
    resetState();
  }, [discomfortLevel, effortPerceptionRpe, overallSatisfaction, onComplete, resetState]);

  // RPE descriptions for 1-10 scale
  const rpeDescriptions = [
    'Muito fácil', // 1
    'Fácil', // 2
    'Moderado', // 3
    'Um pouco difícil', // 4
    'Difícil', // 5
    'Muito difícil', // 6
    'Extremamente difícil', // 7
    'Quase máximo', // 8
    'Máximo', // 9
    'Impossível' // 10
  ];

  // Discomfort descriptions
  const discomfortDescriptions = [
    'Nenhum', // 1
    'Mínimo', // 2
    'Leve', // 3
    'Moderado', // 4
    'Considerável', // 5
    'Alto', // 6
    'Muito alto', // 7
    'Intenso', // 8
    'Muito intenso', // 9
    'Extremo' // 10
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
      }}>
        <Card 
          variant="elevated" 
          padding="lg" 
          style={{
            width: '100%',
            maxWidth: 400,
            maxHeight: '85%',
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[
              typography.presets.cardTitle,
              { textAlign: 'center', marginBottom: spacing.lg, color: colors.accent.primary }
            ]}>
              🎯 Avaliação Pós-Treino
            </Text>

            {/* Overall Satisfaction */}
            <SatisfactionSelector
              value={overallSatisfaction}
              onChange={setOverallSatisfaction}
            />

            {/* Effort Perception (RPE) */}
            <ScaleSelector
              title="Percepção de Esforço"
              subtitle="Quão difícil foi o treino para você?"
              value={effortPerceptionRpe}
              onChange={setEffortPerceptionRpe}
              minValue={1}
              maxValue={10}
              minLabel="Muito fácil"
              maxLabel="Máximo esforço"
              color={colors.accent.primary}
              descriptions={rpeDescriptions}
            />

            {/* Discomfort Level */}
            <ScaleSelector
              title="Nível de Desconforto"
              subtitle="Algum desconforto ou dor durante/após o treino?"
              value={discomfortLevel}
              onChange={setDiscomfortLevel}
              minValue={1}
              maxValue={10}
              minLabel="Nenhum desconforto"
              maxLabel="Desconforto extremo"
              color={discomfortLevel > 5 ? colors.semantic.warning : colors.accent.secondary}
              descriptions={discomfortDescriptions}
            />

            <Button
              title="Finalizar Avaliação"
              onPress={handleComplete}
              variant="gradient"
              size="lg"
              fullWidth
              disabled={overallSatisfaction === 0}
              style={{ marginTop: spacing.md }}
            />

            <Button
              title="Cancelar"
              onPress={handleCancel}
              variant="ghost"
              size="sm"
              style={{ marginTop: spacing.sm }}
            />
          </ScrollView>
        </Card>
      </View>
    </Modal>
  );
});