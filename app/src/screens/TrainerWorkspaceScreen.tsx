import React, { memo, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  Button,
  Card,
  Icon,
  MetricCard,
} from '../design-system';

interface TrainerWorkspaceScreenProps {
  navigation: any;
}

export const TrainerWorkspaceScreen = memo<TrainerWorkspaceScreenProps>(({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState<'exercicios' | 'treinos' | 'programas'>('exercicios');

  const handleTabPress = useCallback((tab: 'exercicios' | 'treinos' | 'programas') => {
    Haptics.selectionAsync();
    setSelectedTab(tab);
  }, []);

  // Componente da hierarquia visual
  const HierarchyFlow = () => (
    <Card variant="glass" padding="lg" style={{ marginBottom: spacing.lg }}>
      <Text style={[typography.presets.sectionTitle, { marginBottom: spacing.md, textAlign: 'center' }]}>
        Como Funciona
      </Text>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Exercício */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{
            width: 50,
            height: 50,
            backgroundColor: colors.accent.primary + '20',
            borderRadius: borderRadius.xl,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.sm,
            borderWidth: 2,
            borderColor: colors.accent.primary,
          }}>
            <Text style={{ fontSize: 20 }}>💪</Text>
          </View>
          <Text style={[typography.presets.cardTitle, { fontSize: 12, textAlign: 'center' }]}>
            EXERCÍCIO
          </Text>
          <Text style={[typography.presets.caption, { textAlign: 'center', marginTop: spacing.xxs }]}>
            Unidade básica
          </Text>
        </View>

        {/* Seta */}
        <View style={{ marginHorizontal: spacing.sm }}>
          <Icon name="chevron-right" size={16} color={colors.text.secondary} />
        </View>

        {/* Treino */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{
            width: 50,
            height: 50,
            backgroundColor: colors.accent.secondary + '20',
            borderRadius: borderRadius.xl,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.sm,
            borderWidth: 2,
            borderColor: colors.accent.secondary,
          }}>
            <Text style={{ fontSize: 20 }}>🏋️</Text>
          </View>
          <Text style={[typography.presets.cardTitle, { fontSize: 12, textAlign: 'center' }]}>
            TREINO
          </Text>
          <Text style={[typography.presets.caption, { textAlign: 'center', marginTop: spacing.xxs }]}>
            Conjunto de exercícios
          </Text>
        </View>

        {/* Seta */}
        <View style={{ marginHorizontal: spacing.sm }}>
          <Icon name="chevron-right" size={16} color={colors.text.secondary} />
        </View>

        {/* Programa */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{
            width: 50,
            height: 50,
            backgroundColor: colors.accent.tertiary + '20',
            borderRadius: borderRadius.xl,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.sm,
            borderWidth: 2,
            borderColor: colors.accent.tertiary,
          }}>
            <Text style={{ fontSize: 20 }}>📅</Text>
          </View>
          <Text style={[typography.presets.cardTitle, { fontSize: 12, textAlign: 'center' }]}>
            PROGRAMA
          </Text>
          <Text style={[typography.presets.caption, { textAlign: 'center', marginTop: spacing.xxs }]}>
            Cronograma completo
          </Text>
        </View>
      </View>
    </Card>
  );

  // Componente de tabs
  const TabsComponent = () => (
    <View style={{
      flexDirection: 'row',
      backgroundColor: colors.background.elevated,
      borderRadius: borderRadius.xl,
      padding: spacing.xs,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.surface.border,
    }}>
      {[
        { key: 'exercicios', label: 'Exercícios', icon: '💪' },
        { key: 'treinos', label: 'Treinos', icon: '🏋️' },
        { key: 'programas', label: 'Programas', icon: '📅' }
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          onPress={() => handleTabPress(tab.key as any)}
          style={{
            flex: 1,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.sm,
            borderRadius: borderRadius.lg,
            backgroundColor: selectedTab === tab.key ? colors.accent.primary : 'transparent',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 16, marginBottom: spacing.xxs }}>
            {tab.icon}
          </Text>
          <Text style={[
            typography.presets.body,
            {
              color: selectedTab === tab.key ? colors.background.primary : colors.text.primary,
              fontWeight: selectedTab === tab.key ? '600' : '500',
              fontSize: 12,
            }
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Conteúdo para cada tab
  const ExerciciosContent = () => (
    <View>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        <MetricCard
          value={25}
          label="Exercícios Criados"
          icon={<Text style={{ fontSize: 18 }}>💪</Text>}
          accentColor={colors.accent.primary}
          size="md"
          style={{ flex: 1 }}
        />
        <MetricCard
          value={12}
          label="Grupos Musculares"
          icon={<Text style={{ fontSize: 18 }}>🎯</Text>}
          accentColor={colors.semantic.info}
          size="md"
          style={{ flex: 1 }}
        />
      </View>

      <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.md }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 32, marginBottom: spacing.sm }}>💪</Text>
          <Text style={[typography.presets.cardTitle, { marginBottom: spacing.xs, textAlign: 'center' }]}>
            Exercícios
          </Text>
          <Text style={[typography.presets.body, { textAlign: 'center', marginBottom: spacing.lg, color: colors.text.secondary }]}>
            Crie exercícios únicos com instruções, grupos musculares e dificuldade
          </Text>
          
          <View style={{ flexDirection: 'row', gap: spacing.sm, width: '100%' }}>
            <Button
              title="Criar Exercício"
              onPress={() => {
                Haptics.selectionAsync();
                navigation.navigate('CreateExercise');
              }}
              variant="gradient"
              size="md"
              fullWidth
              style={{ flex: 1 }}
              icon={<Text style={{ fontSize: 16 }}>➕</Text>}
            />
            <Button
              title="Ver Biblioteca"
              onPress={() => {
                Haptics.selectionAsync();
                navigation.navigate('ExerciseLibrary');
              }}
              variant="secondary"
              size="md"
              fullWidth
              style={{ flex: 1 }}
              icon={<Icon name="library" size={16} color={colors.accent.secondary} />}
            />
          </View>
        </View>
      </Card>

      <Text style={[typography.presets.body, { color: colors.text.secondary, textAlign: 'center', fontStyle: 'italic' }]}>
        "Flexão", "Agachamento", "Prancha"...
      </Text>
    </View>
  );

  const TreinosContent = () => (
    <View>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        <MetricCard
          value={8}
          label="Treinos Criados"
          icon={<Text style={{ fontSize: 18 }}>🏋️</Text>}
          accentColor={colors.accent.secondary}
          size="md"
          style={{ flex: 1 }}
        />
        <MetricCard
          value={45}
          label="Exercícios Usados"
          icon={<Text style={{ fontSize: 18 }}>🔗</Text>}
          accentColor={colors.accent.primary}
          size="md"
          style={{ flex: 1 }}
        />
      </View>

      <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.md }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 32, marginBottom: spacing.sm }}>🏋️</Text>
          <Text style={[typography.presets.cardTitle, { marginBottom: spacing.xs, textAlign: 'center' }]}>
            Treinos
          </Text>
          <Text style={[typography.presets.body, { textAlign: 'center', marginBottom: spacing.lg, color: colors.text.secondary }]}>
            Monte sequências de exercícios com séries, repetições e ordem específica
          </Text>
          
          <View style={{ flexDirection: 'row', gap: spacing.sm, width: '100%' }}>
            <Button
              title="Criar Treino"
              onPress={() => {
                Haptics.selectionAsync();
                navigation.navigate('CreateWorkout');
              }}
              variant="gradient"
              size="md"
              fullWidth
              style={{ flex: 1 }}
              icon={<Text style={{ fontSize: 16 }}>➕</Text>}
            />
            <Button
              title="Ver Treinos"
              onPress={() => {
                Haptics.selectionAsync();
                navigation.navigate('WorkoutLibrary');
              }}
              variant="secondary"
              size="md"
              fullWidth
              style={{ flex: 1 }}
              icon={<Icon name="library" size={16} color={colors.accent.secondary} />}
            />
          </View>
        </View>
      </Card>

      <Text style={[typography.presets.body, { color: colors.text.secondary, textAlign: 'center', fontStyle: 'italic' }]}>
        "Upper Body", "Pernas", "Full Body"...
      </Text>
    </View>
  );

  const ProgramasContent = () => (
    <View>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        <MetricCard
          value={3}
          label="Programas Ativos"
          icon={<Text style={{ fontSize: 18 }}>📅</Text>}
          accentColor={colors.accent.tertiary}
          size="md"
          style={{ flex: 1 }}
        />
        <MetricCard
          value={15}
          label="Clientes Inscritos"
          icon={<Text style={{ fontSize: 18 }}>👥</Text>}
          accentColor={colors.semantic.success}
          size="md"
          style={{ flex: 1 }}
        />
      </View>

      <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.md }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 32, marginBottom: spacing.sm }}>📅</Text>
          <Text style={[typography.presets.cardTitle, { marginBottom: spacing.xs, textAlign: 'center' }]}>
            Programas
          </Text>
          <Text style={[typography.presets.body, { textAlign: 'center', marginBottom: spacing.lg, color: colors.text.secondary }]}>
            Organize treinos em cronogramas de dias/semanas e atribua aos seus clientes
          </Text>
          
          <View style={{ flexDirection: 'row', gap: spacing.sm, width: '100%' }}>
            <Button
              title="Criar Programa"
              onPress={() => {
                Haptics.selectionAsync();
                navigation.navigate('CreateProgram');
              }}
              variant="gradient"
              size="md"
              fullWidth
              style={{ flex: 1 }}
              icon={<Text style={{ fontSize: 16 }}>➕</Text>}
            />
            <Button
              title="Ver Programas"
              onPress={() => {
                Haptics.selectionAsync();
                navigation.navigate('ProgramLibrary');
              }}
              variant="secondary"
              size="md"
              fullWidth
              style={{ flex: 1 }}
              icon={<Icon name="library" size={16} color={colors.accent.secondary} />}
            />
          </View>
        </View>
      </Card>

      <Text style={[typography.presets.body, { color: colors.text.secondary, textAlign: 'center', fontStyle: 'italic' }]}>
        "7 dias de barriga tanquinho", "30 dias hipertrofia"...
      </Text>
    </View>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 'exercicios':
        return <ExerciciosContent />;
      case 'treinos':
        return <TreinosContent />;
      case 'programas':
        return <ProgramasContent />;
      default:
        return <ExerciciosContent />;
    }
  };

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
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
            <View>
              <Text style={typography.presets.screenTitle}>
                Workspace
              </Text>
              <Text style={[typography.presets.body, { color: colors.text.secondary }]}>
                Construa seu arsenal de treinos
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                width: 44,
                height: 44,
                backgroundColor: colors.background.elevated,
                borderRadius: borderRadius.lg,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.surface.border,
              }}
            >
              <Icon name="chevron-left" size={16} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Fluxo da Hierarquia */}
          <HierarchyFlow />

          {/* Tabs */}
          <TabsComponent />

          {/* Conteúdo da tab selecionada */}
          {renderContent()}

          {/* Ações em destaque */}
          <Card variant="glass" padding="lg" style={{ marginTop: spacing.lg }}>
            <Text style={[typography.presets.sectionTitle, { marginBottom: spacing.md, textAlign: 'center' }]}>
              🚀 Exemplo Prático
            </Text>
            <Text style={[typography.presets.body, { textAlign: 'center', marginBottom: spacing.lg, color: colors.text.secondary }]}>
              Veja como criar um programa completo "7 Dias de Barriga Tanquinho"
            </Text>
            <Button
              title="Ver Tutorial Completo"
              onPress={() => {
                Haptics.selectionAsync();
                Alert.alert(
                  'Tutorial: 7 Dias de Barriga Tanquinho',
                  '1️⃣ Criar exercícios: Prancha, Bicycle Crunch, Mountain Climbers\n\n2️⃣ Criar treinos: Dia 1, Dia 2... Dia 7 (cada um com os 3 exercícios)\n\n3️⃣ Criar programa: Agendar um treino para cada dia da semana\n\n4️⃣ Atribuir: Compartilhar com seus clientes!',
                  [{ text: 'Entendi!', style: 'default' }]
                );
              }}
              variant="gradient"
              size="md"
              fullWidth
              icon={<Text style={{ fontSize: 16 }}>🎯</Text>}
            />
          </Card>

          {/* Espaçamento final */}
          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
});