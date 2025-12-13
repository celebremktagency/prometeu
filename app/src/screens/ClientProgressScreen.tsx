import React, { memo, useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, RefreshControl } from 'react-native';
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
 Avatar,
 MetricCard,
 ProgressBar,
} from '../design-system';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { feedbackService, ClientProgressData, WorkoutSessionSummary, ExerciseFeedback } from '../services/feedbackService';

interface ClientProgressScreenProps {
 navigation: any;
 route: {
  params: {
   clientId: string;
   clientName?: string;
  };
 };
}

export const ClientProgressScreen = memo<ClientProgressScreenProps>(({ navigation, route }) => {
 const { clientId, clientName } = route.params;
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [progressData, setProgressData] = useState<ClientProgressData | null>(null);
 const [detailedFeedback, setDetailedFeedback] = useState<{
  sessions: WorkoutSessionSummary[];
  exerciseFeedback: (ExerciseFeedback & { exercise_name?: string })[];
 } | null>(null);
 const [selectedTab, setSelectedTab] = useState<'overview' | 'sessions' | 'exercises'>('overview');

 const loadProgressData = useCallback(async () => {
  try {
   const progress = await feedbackService.getClientProgress(clientId);
   setProgressData(progress);

   const detailed = await feedbackService.getClientDetailedFeedback(clientId);
   setDetailedFeedback(detailed);

  } catch (error: any) {
   console.error('Erro ao carregar progresso:', error);
   Alert.alert('Erro', 'Não foi possível carregar os dados do cliente');
  } finally {
   setLoading(false);
  }
 }, [clientId]);

 const onRefresh = useCallback(async () => {
  setRefreshing(true);
  await loadProgressData();
  setRefreshing(false);
 }, [loadProgressData]);

 useEffect(() => {
  loadProgressData();
 }, [loadProgressData]);

 const handleGoBack = useCallback(() => {
  Haptics.selectionAsync();
  navigation.goBack();
 }, [navigation]);

 const handleAddTrainerNotes = useCallback(async (sessionId: string, currentNotes?: string) => {
  Haptics.selectionAsync();
  
  Alert.prompt(
   'Adicionar Notas',
   'Adicione suas observações sobre esta sessão:',
   [
    { text: 'Cancelar', style: 'cancel' },
    {
     text: 'Salvar',
     onPress: async (notes) => {
      if (!notes || notes.trim().length === 0) return;
      
      try {
       await feedbackService.addTrainerNotes(sessionId, notes.trim());
       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
       Alert.alert('Sucesso', 'Notas adicionadas com sucesso!');
       await loadProgressData(); // Refresh data
      } catch (error: any) {
       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
       Alert.alert('Erro', error.message);
      }
     }
    }
   ],
   'plain-text',
   currentNotes || ''
  );
 }, [loadProgressData]);

 const handleAddTechniqueFeedback = useCallback(async (feedbackId: string, currentFeedback?: string) => {
  Haptics.selectionAsync();
  
  Alert.prompt(
   'Feedback Técnico',
   'Adicione feedback sobre a técnica do exercício:',
   [
    { text: 'Cancelar', style: 'cancel' },
    {
     text: 'Salvar',
     onPress: async (feedback) => {
      if (!feedback || feedback.trim().length === 0) return;
      
      try {
       await feedbackService.updateTechniqueFeedback(feedbackId, feedback.trim());
       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
       Alert.alert('Sucesso', 'Feedback técnico adicionado!');
       await loadProgressData(); // Refresh data
      } catch (error: any) {
       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
       Alert.alert('Erro', error.message);
      }
     }
    }
   ],
   'plain-text',
   currentFeedback || ''
  );
 }, [loadProgressData]);

 const getProgressTrendEmoji = (trend: string) => {
  switch (trend) {
   case 'improving': return '📈';
   case 'declining': return '📉';
   default: return '';
  }
 };

 const getProgressTrendColor = (trend: string) => {
  switch (trend) {
   case 'improving': return colors.accent.secondary;
   case 'declining': return colors.semantic.error;
   default: return colors.text.secondary;
  }
 };

 const renderOverview = () => (
  <View>
   {/* Progress Metrics */}
   <View style={{
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
   }}>
    <MetricCard
     value={progressData?.total_workouts || 0}
     label="Treinos Completos"
     icon={<Ionicons name="fitness-outline" size={20} color={colors.accent.primary} />}
     accentColor={colors.accent.primary}
     size="sm"
     style={{ flex: 1 }}
    />
    <MetricCard
     value={`${progressData?.avg_rating || 0}/5`}
     label="Avaliação Média"
     icon={<Ionicons name="heart-outline" size={20} color={colors.semantic.warning} />}
     accentColor={colors.semantic.warning}
     size="sm"
     style={{ flex: 1 }}
    />
   </View>

   {/* Detailed Metrics */}
   <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.lg }}>
    <Text style={[typography.presets.cardTitle, { marginBottom: spacing.md }]}>
      Métricas Detalhadas
    </Text>
    
    <View style={{ gap: spacing.md }}>
     <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
     }}>
      <Text style={typography.presets.body}>Dificuldade Média:</Text>
      <View style={{
       flexDirection: 'row',
       alignItems: 'center',
       gap: spacing.xs,
      }}>
       <ProgressBar
        current={progressData?.avg_difficulty || 0}
        total={5}
        accentColor={colors.semantic.info}
        label="Dificuldade"
       />
       <Text style={[typography.presets.body, { fontWeight: '600' }]}>
        {progressData?.avg_difficulty || 0}/5
       </Text>
      </View>
     </View>

     <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
     }}>
      <Text style={typography.presets.body}>Nível de Dor Médio:</Text>
      <View style={{
       flexDirection: 'row',
       alignItems: 'center',
       gap: spacing.xs,
      }}>
       <ProgressBar
        current={progressData?.avg_pain_level || 0}
        total={10}
        accentColor={colors.semantic.error}
        label="Nível de Dor"
       />
       <Text style={[typography.presets.body, { fontWeight: '600' }]}>
        {progressData?.avg_pain_level || 0}/10
       </Text>
      </View>
     </View>

     <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
     }}>
      <Text style={typography.presets.body}>Tendência:</Text>
      <View style={{
       flexDirection: 'row',
       alignItems: 'center',
       gap: spacing.xs,
      }}>
       <Text style={{ fontSize: 16 }}>
        {getProgressTrendEmoji(progressData?.progress_trend || 'stable')}
       </Text>
       <Text style={[
        typography.presets.body, 
        { 
         fontWeight: '600',
         color: getProgressTrendColor(progressData?.progress_trend || 'stable')
        }
       ]}>
        {progressData?.progress_trend === 'improving' ? 'Melhorando' :
         progressData?.progress_trend === 'declining' ? 'Declinando' : 'Estável'}
       </Text>
      </View>
     </View>
    </View>
   </Card>

   {/* Last Workout Info */}
   {progressData?.last_workout_date && (
    <Card variant="glass" padding="md">
     <Text style={[typography.presets.body, { textAlign: 'center' }]}>
      <Text style={{ fontWeight: '600' }}>Último treino:</Text>{' '}
      {new Date(progressData.last_workout_date).toLocaleDateString('pt-BR', {
       day: '2-digit',
       month: 'long',
       year: 'numeric'
      })}
     </Text>
    </Card>
   )}
  </View>
 );

 const renderSessions = () => (
  <View>
   {detailedFeedback?.sessions.length === 0 ? (
    <Card variant="glass" padding="lg">
     <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>🏃</Text>
      <Text style={[typography.presets.body, { textAlign: 'center', color: colors.text.secondary }]}>
       Este cliente ainda não completou nenhuma sessão de treino
      </Text>
     </View>
    </Card>
   ) : (
    <View>
     {detailedFeedback?.sessions.map((session) => (
      <Card key={session.id} variant="elevated" padding="md" style={{ marginBottom: spacing.sm }}>
       <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
       }}>
        <View style={{ flex: 1 }}>
         <Text style={[typography.presets.cardTitle, { marginBottom: spacing.xs }]}>
          Sessão de {new Date(session.started_at).toLocaleDateString('pt-BR')}
         </Text>
         <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
          Duração: {session.total_duration_minutes || 0} min
         </Text>
        </View>
        
        {session.overall_rating && (
         <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
         }}>
          <Ionicons name="heart-outline" size={20} color={colors.semantic.warning} />
          <Text style={[typography.presets.body, { fontWeight: '600' }]}>
           {session.overall_rating}/5
          </Text>
         </View>
        )}
       </View>

       {session.workout_notes && (
        <View style={{
         backgroundColor: colors.surface.card,
         borderRadius: borderRadius.sm,
         padding: spacing.sm,
         marginBottom: spacing.sm,
        }}>
         <Text style={[typography.presets.caption, { color: colors.text.tertiary, marginBottom: 2 }]}>
          Notas do cliente:
         </Text>
         <Text style={typography.presets.body}>
          {session.workout_notes}
         </Text>
        </View>
       )}

       {session.trainer_notes && (
        <View style={{
         backgroundColor: colors.background.elevated,
         borderRadius: borderRadius.sm,
         padding: spacing.sm,
         marginBottom: spacing.sm,
        }}>
         <Text style={[typography.presets.caption, { color: colors.accent.primary, marginBottom: 2 }]}>
          Suas notas:
         </Text>
         <Text style={typography.presets.body}>
          {session.trainer_notes}
         </Text>
        </View>
       )}

       <Button
        title={session.trainer_notes ? "Editar Notas" : "Adicionar Notas"}
        onPress={() => handleAddTrainerNotes(session.id!, session.trainer_notes)}
        variant="ghost"
        size="sm"
       />
      </Card>
     ))}
    </View>
   )}
  </View>
 );

 const renderExercises = () => (
  <View>
   {detailedFeedback?.exerciseFeedback.length === 0 ? (
    <Card variant="glass" padding="lg">
     <View style={{ alignItems: 'center' }}>
      <Ionicons name="barbell-outline" size={20} color={colors.accent.primary} />
      <Text style={[typography.presets.body, { textAlign: 'center', color: colors.text.secondary }]}>
       Nenhum feedback de exercício disponível ainda
      </Text>
     </View>
    </Card>
   ) : (
    <View>
     {detailedFeedback?.exerciseFeedback.map((feedback) => (
      <Card key={feedback.id} variant="elevated" padding="md" style={{ marginBottom: spacing.sm }}>
       <View style={{ marginBottom: spacing.sm }}>
        <Text style={[typography.presets.cardTitle, { marginBottom: spacing.xs }]}>
         {feedback.exercise_name}
        </Text>
        <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
         {new Date(feedback.created_at!).toLocaleDateString('pt-BR')}
        </Text>
       </View>

       <View style={{
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.sm,
       }}>
        {feedback.rating && (
         <View style={{ alignItems: 'center' }}>
          <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
           Avaliação
          </Text>
          <Text style={[typography.presets.body, { fontWeight: '600' }]}>
            {feedback.rating}/5
          </Text>
         </View>
        )}
        
        {feedback.difficulty_level && (
         <View style={{ alignItems: 'center' }}>
          <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
           Dificuldade
          </Text>
          <Text style={[typography.presets.body, { fontWeight: '600' }]}>
            {feedback.difficulty_level}/5
          </Text>
         </View>
        )}

        {feedback.pain_level !== undefined && (
         <View style={{ alignItems: 'center' }}>
          <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
           Dor
          </Text>
          <Text style={[typography.presets.body, { fontWeight: '600' }]}>
           🩹 {feedback.pain_level}/10
          </Text>
         </View>
        )}
       </View>

       {feedback.notes && (
        <View style={{
         backgroundColor: colors.surface.card,
         borderRadius: borderRadius.sm,
         padding: spacing.sm,
         marginBottom: spacing.sm,
        }}>
         <Text style={[typography.presets.caption, { color: colors.text.tertiary, marginBottom: 2 }]}>
          Feedback do cliente:
         </Text>
         <Text style={typography.presets.body}>
          {feedback.notes}
         </Text>
        </View>
       )}

       {feedback.technique_feedback && (
        <View style={{
         backgroundColor: colors.background.elevated,
         borderRadius: borderRadius.sm,
         padding: spacing.sm,
         marginBottom: spacing.sm,
        }}>
         <Text style={[typography.presets.caption, { color: colors.accent.primary, marginBottom: 2 }]}>
          Seu feedback técnico:
         </Text>
         <Text style={typography.presets.body}>
          {feedback.technique_feedback}
         </Text>
        </View>
       )}

       <Button
        title={feedback.technique_feedback ? "Editar Feedback Técnico" : "Adicionar Feedback Técnico"}
        onPress={() => handleAddTechniqueFeedback(feedback.id!, feedback.technique_feedback)}
        variant="ghost"
        size="sm"
       />
      </Card>
     ))}
    </View>
   )}
  </View>
 );

 if (loading) {
  return (
   <ScreenWrapper navigation={navigation} showTabBar={false}>
    <LinearGradient
     colors={[colors.background.primary, colors.background.secondary]}
     style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
     <Text style={typography.presets.body}>Carregando progresso...</Text>
    </LinearGradient>
   </ScreenWrapper>
  );
 }

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
      📈 Progresso
     </Text>
     
     <View style={{ width: 44 }} />
    </View>

    {/* Client Info */}
    <View style={{
     flexDirection: 'row',
     alignItems: 'center',
     gap: spacing.md,
     paddingHorizontal: spacing.screenHorizontal,
     marginBottom: spacing.lg,
    }}>
     <Avatar
      name={progressData?.client_name || clientName || 'Cliente'}
      size="md"
      showBorder={true}
     />
     <View>
      <Text style={typography.presets.sectionTitle}>
       {progressData?.client_name || clientName || 'Cliente'}
      </Text>
      <Text style={[typography.presets.body, { color: colors.text.secondary }]}>
       Acompanhamento de progresso
      </Text>
     </View>
    </View>

    {/* Tab Navigation */}
    <View style={{
     flexDirection: 'row',
     paddingHorizontal: spacing.screenHorizontal,
     marginBottom: spacing.lg,
    }}>
     {[
      { id: 'overview', label: 'Visão Geral', icon: '' },
      { id: 'sessions', label: 'Sessões', icon: '' },
      { id: 'exercises', label: 'Exercícios', icon: '' },
     ].map((tab) => (
      <TouchableOpacity
       key={tab.id}
       onPress={() => {
        Haptics.selectionAsync();
        setSelectedTab(tab.id as any);
       }}
       style={{
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: selectedTab === tab.id ? colors.accent.primary : 'transparent',
       }}
      >
       <Text style={{ fontSize: 16, marginBottom: 2 }}>{tab.icon}</Text>
       <Text style={[
        typography.presets.caption,
        {
         fontWeight: selectedTab === tab.id ? '600' : '400',
         color: selectedTab === tab.id ? colors.accent.primary : colors.text.secondary,
        }
       ]}>
        {tab.label}
       </Text>
      </TouchableOpacity>
     ))}
    </View>

    <ScrollView
     style={{ flex: 1 }}
     contentContainerStyle={{
      paddingHorizontal: spacing.screenHorizontal,
      paddingBottom: spacing.screenVertical,
     }}
     showsVerticalScrollIndicator={false}
     refreshControl={
      <RefreshControl
       refreshing={refreshing}
       onRefresh={onRefresh}
       tintColor={colors.accent.primary}
      />
     }
    >
     {selectedTab === 'overview' && renderOverview()}
     {selectedTab === 'sessions' && renderSessions()}
     {selectedTab === 'exercises' && renderExercises()}

     {/* Espaçamento final */}
     <View style={{ height: spacing.xl }} />
    </ScrollView>
   </LinearGradient>
  </ScreenWrapper>
 );
});