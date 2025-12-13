import React, { memo, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native';
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
import { templateService, WorkoutTemplate } from '../services/templateService';
import { authService } from '../services/authService';
import { useUserType } from '../hooks/useUserType';

interface TemplateDetailScreenProps {
 navigation: any;
 route: {
  params: {
   template: WorkoutTemplate;
  };
 };
}

export const TemplateDetailScreen = memo<TemplateDetailScreenProps>(({ navigation, route }) => {
 const { template: initialTemplate } = route.params;
 const [template, setTemplate] = useState<WorkoutTemplate>(initialTemplate);
 const [loading, setLoading] = useState(false);
 const [loadingTemplate, setLoadingTemplate] = useState(true);
 const { userType } = useUserType();

 // Load full template data with exercises
 const loadTemplateData = useCallback(async () => {
  try {
   setLoadingTemplate(true);
   const fullTemplate = await templateService.obterTemplate(initialTemplate.id);
   setTemplate(fullTemplate);
  } catch (error) {
   console.error('Erro ao carregar template completo:', error);
   // Keep using initial template if loading fails
   setTemplate(initialTemplate);
  } finally {
   setLoadingTemplate(false);
  }
 }, [initialTemplate]);

 React.useEffect(() => {
  loadTemplateData();
 }, [loadTemplateData]);

 const handleGoBack = useCallback(() => {
  Haptics.selectionAsync();
  navigation.goBack();
 }, [navigation]);

 const handleStartTemplate = useCallback(async () => {
  if (userType === 'trainer') {
   // Professional: Navigate to client selection
   navigation.navigate('ClientList', { 
    mode: 'assign_template', 
    template: template,
    title: 'Atribuir Programa'
   });
  } else {
   // Client: Start template for themselves
   Alert.alert(
    'Iniciar Programa',
    `Deseja iniciar o programa "${template.nome}" com ${template.total_exercicios} exercícios?`,
    [
     { text: 'Cancelar', style: 'cancel' },
     {
      text: 'Iniciar',
      onPress: async () => {
       try {
        setLoading(true);
        await templateService.iniciarTemplate(template.id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Navigate to program execution screen
        navigation.navigate('ProgramExecution', { template });
       } catch (error: any) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Erro', error.message || 'Não foi possível iniciar o programa');
       } finally {
        setLoading(false);
       }
      }
     }
    ]
   );
  }
 }, [template, navigation, userType]);

 const handleWorkoutPress = useCallback((workout: any) => {
  Haptics.selectionAsync();
  navigation.navigate('WorkoutDetail', { workout });
 }, [navigation]);

 const getLevelColor = (nivel: string) => {
  switch (nivel) {
   case 'iniciante': return colors.accent.secondary;
   case 'intermediario': return colors.semantic.warning;
   case 'avancado': return colors.semantic.error;
   default: return colors.accent.primary;
  }
 };

 const getCategoryIcon = (tipo: string) => {
  switch (tipo) {
   case 'cardio': return <Icon name='health' size={16} color={colors.semantic.error} />;
   case 'forca': return '';
   case 'flexibilidade': return '🤸';
   case 'equilibrio': return <Icon name='target' size={16} color={colors.accent.primary} />;
   case 'funcional': return '🏃';
   case 'personalizado': return '';
   default: return <Icon name='settings' size={16} color={colors.text.secondary} />;
  }
 };

 const renderWorkoutItem = ({ item, index }: { item: any; index: number }) => (
  <TouchableOpacity
   onPress={() => handleWorkoutPress(item)}
   activeOpacity={0.8}
   style={{ marginBottom: spacing.sm }}
  >
   <Card variant="elevated" padding="md">
    <View style={{
     flexDirection: 'row',
     alignItems: 'center',
     gap: spacing.sm,
    }}>
     {/* Número da ordem */}
     <View style={{
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.accent.primary,
      alignItems: 'center',
      justifyContent: 'center',
     }}>
      <Text style={[
       typography.presets.caption,
       { color: colors.text.inverse, fontWeight: '700' }
      ]}>
       {index + 1}
      </Text>
     </View>

     {/* Conteúdo do treino */}
     <View style={{ flex: 1 }}>
      <Text style={[typography.presets.body, { fontWeight: '600', marginBottom: spacing.xxs }]}>
       {item.exercicio}
      </Text>
      
      <View style={{
       flexDirection: 'row',
       alignItems: 'center',
       gap: spacing.sm,
      }}>
       <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
        {item.series || 3} séries
       </Text>
       <View style={{
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.text.tertiary,
       }} />
       <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
        {item.repeticoes || '10'} reps
       </Text>
       <View style={{
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.text.tertiary,
       }} />
       <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
        {item.duracao_min || 30}min
       </Text>
      </View>
     </View>

     {/* Seta */}
     <Text style={{ fontSize: 16, color: colors.text.tertiary }}>→</Text>
    </View>
   </Card>
  </TouchableOpacity>
 );

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
     
     <View style={{ width: 44 }} />
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
        <View style={{
         flexDirection: 'row',
         alignItems: 'center',
         gap: spacing.xs,
         marginBottom: spacing.xs,
        }}>
         <Text style={{ fontSize: 20 }}>
          {getCategoryIcon(template.tipo_treino)}
         </Text>
         <Text style={[typography.presets.cardTitle]}>
          {template.nome}
         </Text>
        </View>
       </View>
       
       <View style={{
        backgroundColor: getLevelColor(template.nivel_dificuldade),
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        marginLeft: spacing.sm,
       }}>
        <Text style={[
         typography.presets.caption,
         { color: colors.text.inverse, fontWeight: '600' }
        ]}>
         {template.nivel_dificuldade?.toUpperCase() || 'INICIANTE'}
        </Text>
       </View>
      </View>

      {template.descricao && (
       <View style={{
        backgroundColor: colors.surface.card,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
       }}>
        <Text style={[typography.presets.body, { lineHeight: 20 }]}>
         {template.descricao}
        </Text>
       </View>
      )}

      {/* Criado por */}
      <View style={{
       flexDirection: 'row',
       alignItems: 'center',
       gap: spacing.sm,
       marginTop: spacing.sm,
      }}>
       <Icon name="user" size={16} color={colors.text.primary} />
       <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
        Criado por Usuário
       </Text>
       <View style={{
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.text.tertiary,
       }} />
       <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
        {new Date(template.created_at).toLocaleDateString('pt-BR')}
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
       value={template.total_exercicios || 0}
       label="Exercícios"
       icon={<Icon name="strength" size={16} color={colors.accent.primary} />}
       accentColor={colors.accent.primary}
       size="sm"
       style={{ flex: 1 }}
      />
      <MetricCard
       value={`${template.duracao_estimada_min || 0}min`}
       label="Duração Estimada"
       icon={<Icon name="timer" size={16} color={colors.accent.primary} />}
       accentColor={colors.semantic.warning}
       size="sm"
       style={{ flex: 1 }}
      />
     </View>

     {/* Workouts List */}
     <View style={{ marginBottom: spacing.lg }}>
      <Text style={[
       typography.presets.cardTitle, 
       { marginBottom: spacing.md }
      ]}>
        Exercícios do Programa
      </Text>
      
      {loadingTemplate ? (
       <Card variant="glass" padding="lg">
        <View style={{ alignItems: 'center' }}>
         <Text style={[typography.presets.body, { color: colors.text.secondary }]}>
          Carregando exercícios...
         </Text>
        </View>
       </Card>
      ) : template.treinos?.length > 0 ? (
       template.treinos.map((workout, index) => (
        <View key={workout.id}>
         {renderWorkoutItem({ item: workout, index })}
        </View>
       ))
      ) : (
       <Card variant="glass" padding="lg">
        <View style={{ alignItems: 'center' }}>
         <Icon name="info" size={48} color={colors.text.secondary} style={{ marginBottom: spacing.sm }} />
         <Text style={[typography.presets.body, { textAlign: 'center', color: colors.text.secondary }]}>
          Este programa não possui exercícios configurados
         </Text>
        </View>
       </Card>
      )}
     </View>

     {/* Action Button */}
     {template.treinos?.length > 0 && (
      <Button
       title={
        userType === 'trainer' 
         ? ` Atribuir a Cliente (${template.total_exercicios} exercícios)`
         : ` Iniciar Programa (${template.total_exercicios} exercícios)`
       }
       onPress={handleStartTemplate}
       variant="gradient"
       size="lg"
       loading={loading}
       style={{ marginBottom: spacing.md }}
      />
     )}

     {/* Espaçamento final */}
     <View style={{ height: spacing.xl }} />
    </ScrollView>
   </LinearGradient>
  </ScreenWrapper>
 );
});