import React, { memo, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
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
  YouTubePreview,
} from '../design-system';
import { ScreenWrapper } from '../components/ScreenWrapper';

interface ExerciseDetailScreenProps {
  navigation: any;
  route: {
    params: {
      exercise: any;
    };
  };
}

export const ExerciseDetailScreen = memo<ExerciseDetailScreenProps>(({ navigation, route }) => {
  const { exercise } = route.params;

  const handleGoBack = useCallback(() => {
    Haptics.selectionAsync();
    navigation.goBack();
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
            Exercício
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
          {/* Main Info Card */}
          <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.lg }}>
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
                    {exercise.grupo_muscular.map((group: string, index: number) => (
                      <View key={index} style={{
                        backgroundColor: colors.surface.card,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.xs,
                        borderRadius: borderRadius.sm,
                      }}>
                        <Text style={[typography.presets.caption, { color: colors.accent.primary }]}>
                          {group}
                        </Text>
                      </View>
                    ))}
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
                <Text style={{ fontSize: 12 }}>
                  {getDifficultyIcon(exercise.dificuldade)}
                </Text>
                <Text style={[
                  typography.presets.caption,
                  { color: colors.text.inverse, fontWeight: '600' }
                ]}>
                  {exercise.dificuldade?.toUpperCase() || 'N/A'}
                </Text>
              </View>
            </View>

            {exercise.descricao && (
              <View style={{
                backgroundColor: colors.surface.card,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.sm,
              }}>
                <Text style={[typography.presets.body, { lineHeight: 20 }]}>
                  {exercise.descricao}
                </Text>
              </View>
            )}

            {/* Equipment */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              marginTop: spacing.sm,
            }}>
              <Icon name="tool" size={16} color={colors.text.primary} />
              <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
                Equipamento: {exercise.equipamento || 'Peso corporal'}
              </Text>
            </View>
          </Card>

          {/* Instructions */}
          {exercise.instrucoes && (
            <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.lg }}>
              <Text style={[typography.presets.sectionTitle, { marginBottom: spacing.md }]}>
                Como Executar
              </Text>
              <Text style={[typography.presets.body, { lineHeight: 22 }]}>
                {exercise.instrucoes}
              </Text>
            </Card>
          )}

          {/* Safety Tips */}
          {exercise.dicas_seguranca && (
            <Card variant="glass" padding="lg" style={{ marginBottom: spacing.lg }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                marginBottom: spacing.md,
              }}>
                <Icon name="warning" size={20} color={colors.semantic.warning} />
                <Text style={[typography.presets.sectionTitle, { color: colors.semantic.warning }]}>
                  Dicas de Segurança
                </Text>
              </View>
              <Text style={[typography.presets.body, { lineHeight: 22 }]}>
                {exercise.dicas_seguranca}
              </Text>
            </Card>
          )}

          {/* Video */}
          {exercise.video_url && (
            <YouTubePreview
              url={exercise.video_url}
              title="Vídeo Demonstrativo"
              style={{ marginBottom: spacing.lg }}
            />
          )}

          {/* Action Button */}
          <Button
            title="Adicionar ao Treino"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert('Em breve', 'Funcionalidade em desenvolvimento');
            }}
            variant="gradient"
            size="lg"
            icon={<Icon name="plus" size={16} color={colors.text.inverse} />}
          />

          {/* Espaçamento final */}
          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </LinearGradient>
    </ScreenWrapper>
  );
});

export default ExerciseDetailScreen;