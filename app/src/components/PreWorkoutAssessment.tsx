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

interface PreWorkoutAssessmentProps {
  visible: boolean;
  onComplete: (assessment: PreWorkoutData) => void;
  onCancel: () => void;
}

export interface PreWorkoutData {
  recoveryPerception: number; // 1-10 scale
  hasPain: boolean;
  painLocation?: string;
  painIntensityEva?: number; // 0-10 scale
}

// Common pain locations for quick selection
const PAIN_LOCATIONS = [
  'Pescoço', 'Ombros', 'Braços', 'Cotovelos', 'Punhos',
  'Peito', 'Costas Superior', 'Costas Inferior', 'Abdômen',
  'Quadril', 'Coxa', 'Joelhos', 'Panturrilha', 'Tornozelos', 'Pés'
];

const ScaleSelector = memo<{
  title: string;
  value: number;
  onChange: (value: number) => void;
  minValue: number;
  maxValue: number;
  minLabel: string;
  maxLabel: string;
  color?: string;
}>(({ title, value, onChange, minValue, maxValue, minLabel, maxLabel, color = colors.accent.primary }) => (
  <View style={{ marginBottom: spacing.lg }}>
    <Text style={[
      typography.presets.body,
      { fontWeight: '600', marginBottom: spacing.sm, color: colors.text.primary }
    ]}>
      {title}
    </Text>
    
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
            fontSize: 16,
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
        Valor selecionado: {value}
      </Text>
    </View>
  </View>
));

export const PreWorkoutAssessment = memo<PreWorkoutAssessmentProps>(({
  visible,
  onComplete,
  onCancel,
}) => {
  const [step, setStep] = useState(1); // 1: Recovery, 2: Pain Question, 3: Pain Details (if has pain)
  const [recoveryPerception, setRecoveryPerception] = useState(5);
  const [hasPain, setHasPain] = useState(false);
  const [painLocation, setPainLocation] = useState<string>('');
  const [painIntensityEva, setPainIntensityEva] = useState(0);

  const resetState = useCallback(() => {
    setStep(1);
    setRecoveryPerception(5);
    setHasPain(false);
    setPainLocation('');
    setPainIntensityEva(0);
  }, []);

  const handleCancel = useCallback(() => {
    resetState();
    onCancel();
  }, [resetState, onCancel]);

  const handleNext = useCallback(() => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (hasPain) {
        setStep(3);
      } else {
        // No pain, complete assessment
        onComplete({
          recoveryPerception,
          hasPain: false,
        });
        resetState();
      }
    }
  }, [step, hasPain, recoveryPerception, onComplete, resetState]);

  const handleComplete = useCallback(() => {
    if (!painLocation.trim()) {
      Alert.alert('Atenção', 'Por favor, selecione a localização da dor.');
      return;
    }

    onComplete({
      recoveryPerception,
      hasPain: true,
      painLocation: painLocation.trim(),
      painIntensityEva,
    });
    resetState();
  }, [recoveryPerception, painLocation, painIntensityEva, onComplete, resetState]);

  const selectPainLocation = useCallback((location: string) => {
    Haptics.selectionAsync();
    setPainLocation(location);
  }, []);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View>
            <Text style={[
              typography.presets.cardTitle,
              { textAlign: 'center', marginBottom: spacing.lg, color: colors.accent.primary }
            ]}>
              Avaliação Pré-Treino
            </Text>

            <ScaleSelector
              title="Como você se sente em relação à sua recuperação?"
              value={recoveryPerception}
              onChange={setRecoveryPerception}
              minValue={1}
              maxValue={10}
              minLabel="Muito cansado"
              maxLabel="Totalmente recuperado"
              color={colors.accent.primary}
            />

            <Button
              title="Próximo"
              onPress={handleNext}
              variant="gradient"
              size="lg"
              fullWidth
            />
          </View>
        );

      case 2:
        return (
          <View>
            <Text style={[
              typography.presets.cardTitle,
              { textAlign: 'center', marginBottom: spacing.lg, color: colors.accent.primary }
            ]}>
              Presença de Dor
            </Text>

            <Text style={[
              typography.presets.body,
              { fontWeight: '600', marginBottom: spacing.md, color: colors.text.primary, textAlign: 'center' }
            ]}>
              Você está sentindo alguma dor no momento?
            </Text>

            <View style={{
              flexDirection: 'row',
              gap: spacing.sm,
              marginBottom: spacing.xl,
            }}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setHasPain(false);
                }}
                style={{
                  flex: 1,
                  backgroundColor: !hasPain ? colors.accent.secondary : colors.background.secondary,
                  borderWidth: 2,
                  borderColor: !hasPain ? colors.accent.secondary : colors.surface.border,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.md,
                  alignItems: 'center',
                }}
              >
                <Ionicons 
                  name="happy-outline" 
                  size={32} 
                  color={!hasPain ? colors.text.inverse : colors.text.secondary}
                  style={{ marginBottom: spacing.xs }}
                />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: !hasPain ? colors.text.inverse : colors.text.primary,
                }}>
                  NÃO
                </Text>
                <Text style={[
                  typography.presets.caption,
                  { color: !hasPain ? colors.text.inverse : colors.text.secondary, textAlign: 'center' }
                ]}>
                  Sem dor
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setHasPain(true);
                }}
                style={{
                  flex: 1,
                  backgroundColor: hasPain ? colors.semantic.warning : colors.background.secondary,
                  borderWidth: 2,
                  borderColor: hasPain ? colors.semantic.warning : colors.surface.border,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.md,
                  alignItems: 'center',
                }}
              >
                <Ionicons 
                  name="sad-outline" 
                  size={32} 
                  color={hasPain ? colors.text.inverse : colors.text.secondary}
                  style={{ marginBottom: spacing.xs }}
                />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: hasPain ? colors.text.inverse : colors.text.primary,
                }}>
                  SIM
                </Text>
                <Text style={[
                  typography.presets.caption,
                  { color: hasPain ? colors.text.inverse : colors.text.secondary, textAlign: 'center' }
                ]}>
                  Sinto dor
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              title={hasPain ? "Próximo" : "Finalizar"}
              onPress={handleNext}
              variant="gradient"
              size="lg"
              fullWidth
            />
          </View>
        );

      case 3:
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[
              typography.presets.cardTitle,
              { textAlign: 'center', marginBottom: spacing.lg, color: colors.semantic.warning }
            ]}>
              Detalhes da Dor
            </Text>

            {/* Pain Location */}
            <View style={{ marginBottom: spacing.lg }}>
              <Text style={[
                typography.presets.body,
                { fontWeight: '600', marginBottom: spacing.sm, color: colors.text.primary }
              ]}>
                Onde você sente dor?
              </Text>
              
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: spacing.xs,
              }}>
                {PAIN_LOCATIONS.map((location) => (
                  <TouchableOpacity
                    key={location}
                    onPress={() => selectPainLocation(location)}
                    style={{
                      backgroundColor: painLocation === location 
                        ? colors.semantic.warning + '20' 
                        : colors.background.secondary,
                      borderWidth: 2,
                      borderColor: painLocation === location 
                        ? colors.semantic.warning 
                        : colors.surface.border,
                      borderRadius: borderRadius.md,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                    }}
                  >
                    <Text style={{
                      fontSize: typography.sizes.sm,
                      fontWeight: '600',
                      color: painLocation === location 
                        ? colors.semantic.warning 
                        : colors.text.primary,
                    }}>
                      {location}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {painLocation && (
                <View style={{
                  backgroundColor: colors.background.elevated,
                  borderRadius: borderRadius.md,
                  padding: spacing.sm,
                  marginTop: spacing.sm,
                  alignItems: 'center',
                }}>
                  <Text style={[
                    typography.presets.body,
                    { fontWeight: '600', color: colors.semantic.warning }
                  ]}>
                    Local selecionado: {painLocation}
                  </Text>
                </View>
              )}
            </View>

            {/* Pain Intensity EVA Scale */}
            <ScaleSelector
              title="Intensidade da dor (Escala EVA)"
              value={painIntensityEva}
              onChange={setPainIntensityEva}
              minValue={0}
              maxValue={10}
              minLabel="Sem dor"
              maxLabel="Dor insuportável"
              color={colors.semantic.error}
            />

            <Button
              title="Finalizar Avaliação"
              onPress={handleComplete}
              variant="gradient"
              size="lg"
              fullWidth
              disabled={!painLocation.trim()}
            />
          </ScrollView>
        );

      default:
        return null;
    }
  };

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
            maxHeight: '80%',
          }}
        >
          {/* Progress Indicator */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: spacing.lg,
            gap: spacing.xs,
          }}>
            {[1, 2, 3].map((stepNum) => (
              <View
                key={stepNum}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: step >= stepNum ? colors.accent.primary : colors.surface.border,
                }}
              />
            ))}
          </View>

          {renderStep()}

          {/* Cancel Button */}
          <Button
            title="Cancelar"
            onPress={handleCancel}
            variant="ghost"
            size="sm"
            style={{ marginTop: spacing.md }}
          />
        </Card>
      </View>
    </Modal>
  );
});