import React, { memo, useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
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
} from '../design-system';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';

interface ProgramDetailScreenProps {
  navigation: any;
  route: {
    params: {
      program?: any;
      template?: any; // Para compatibilidade
    };
  };
}

export const ProgramDetailScreen = memo<ProgramDetailScreenProps>(({ navigation, route }) => {
  const program = route.params?.program || route.params?.template;
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await authService.getCurrentUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const handleGoBack = useCallback(() => {
    Haptics.selectionAsync();
    navigation.goBack();
  }, [navigation]);

  const handleStartProgram = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Em breve', 'Funcionalidade de iniciar programa em desenvolvimento');
  }, []);

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

  const getCategoryIcon = (categoria: string) => {
    switch (categoria) {
      case 'Hipertrofia': return '💪';
      case 'Emagrecimento': return '🔥';
      case 'Força': return '🏋️';
      case 'Condicionamento': return '🏃';
      case 'Reabilitação': return '🏥';
      case 'Flexibilidade': return '🧘';
      default: return '📋';
    }
  };

  const isOwner = userProfile?.user_id === program?.criado_por;

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
            <Text style={{ fontSize: 24, color: colors.text.primary }}>←</Text>
          </TouchableOpacity>
          
          <Text style={typography.presets.screenTitle}>
            Programa
          </Text>
          
          {isOwner && (
            <TouchableOpacity onPress={() => Alert.alert('Em breve', 'Edição em desenvolvimento')}>
              <Text style={{ fontSize: 20, color: colors.accent.primary }}>edit</Text>
            </TouchableOpacity>
          )}
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
                  {program?.nome}
                </Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  marginBottom: spacing.sm,
                }}>
                  <Text style={{ fontSize: 16 }}>
                    {getCategoryIcon(program?.categoria)}
                  </Text>
                  <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
                    {program?.categoria}
                  </Text>
                </View>
              </View>
              
              <View style={{
                backgroundColor: getLevelColor(program?.nivel),
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: borderRadius.sm,
              }}>
                <Text style={[
                  typography.presets.caption,
                  { color: colors.text.inverse, fontWeight: '600' }
                ]}>
                  {getLevelIcon(program?.nivel)} {program?.nivel?.toUpperCase() || 'INICIANTE'}
                </Text>
              </View>
            </View>

            {program?.descricao && (
              <View style={{
                backgroundColor: colors.surface.card,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.sm,
              }}>
                <Text style={[typography.presets.body, { lineHeight: 20 }]}>
                  {program?.descricao}
                </Text>
              </View>
            )}

            {/* Program Info */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              marginTop: spacing.sm,
            }}>
              <Icon name="calendar" size={16} color={colors.text.primary} />
              <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
                {program?.duracao_semanas || 4} semanas • {program?.frequencia_semanal || 3}x por semana
              </Text>
            </View>
          </Card>

          {/* Stats */}
          <View style={{
            flexDirection: 'row',
            gap: spacing.sm,
            marginBottom: spacing.lg,
          }}>
            <MetricCard
              value={program?.duracao_semanas || 4}
              label="Semanas"
              icon={<Icon name="calendar" size={16} color={colors.accent.primary} />}
              accentColor={colors.accent.primary}
              size="sm"
              style={{ flex: 1 }}
            />
            <MetricCard
              value={`${program?.frequencia_semanal || 3}x`}
              label="Por Semana"
              icon={<Icon name="repeat" size={16} color={colors.accent.secondary} />}
              accentColor={colors.accent.secondary}
              size="sm"
              style={{ flex: 1 }}
            />
            <MetricCard
              value={program?.objetivo || 'Geral'}
              label="Objetivo"
              icon={<Icon name="target" size={16} color={colors.semantic.warning} />}
              accentColor={colors.semantic.warning}
              size="sm"
              style={{ flex: 1 }}
            />
          </View>

          {/* Program Details */}
          {program?.objetivo && (
            <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.lg }}>
              <Text style={[typography.presets.sectionTitle, { marginBottom: spacing.md }]}>
                Objetivo do Programa
              </Text>
              <Text style={[typography.presets.body, { lineHeight: 22 }]}>
                {program?.objetivo}
              </Text>
            </Card>
          )}

          {/* Tags */}
          {program?.tags && program?.tags.length > 0 && (
            <Card variant="glass" padding="lg" style={{ marginBottom: spacing.lg }}>
              <Text style={[typography.presets.sectionTitle, { marginBottom: spacing.md }]}>
                Tags
              </Text>
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: spacing.xs,
              }}>
                {program?.tags.map((tag: string, index: number) => (
                  <View key={index} style={{
                    backgroundColor: colors.surface.card,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    borderRadius: borderRadius.sm,
                  }}>
                    <Text style={[typography.presets.caption, { color: colors.accent.primary }]}>
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Action Buttons */}
          <Button
            title=" Iniciar Programa"
            onPress={handleStartProgram}
            variant="gradient"
            size="lg"
            style={{ marginBottom: spacing.md }}
          />

          {isOwner && (
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                title="Editar"
                onPress={() => Alert.alert('Em breve', 'Edição em desenvolvimento')}
                variant="secondary"
                size="md"
                icon={<Icon name="edit" size={14} color={colors.text.primary} />}
                style={{ flex: 1 }}
              />
              
              <Button
                title="Duplicar"
                onPress={() => Alert.alert('Em breve', 'Duplicação em desenvolvimento')}
                variant="ghost"
                size="md"
                icon={<Icon name="copy" size={14} color={colors.text.primary} />}
                style={{ flex: 1 }}
              />
            </View>
          )}

          {/* Espaçamento final */}
          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </LinearGradient>
    </ScreenWrapper>
  );
});

export default ProgramDetailScreen;