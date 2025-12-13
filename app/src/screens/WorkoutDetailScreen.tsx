import React, { memo, useState, useEffect, useCallback } from 'react';
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
 YouTubePreview,
 Icon,
} from '../design-system';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';

interface WorkoutDetailScreenProps {
 navigation: any;
 route: {
  params: {
   workout: any;
  };
 };
}

export const WorkoutDetailScreen = memo<WorkoutDetailScreenProps>(({ navigation, route }) => {
 const { workout } = route.params;
 const [loading, setLoading] = useState(false);
 const [userProfile, setUserProfile] = useState<any>(null);
 const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);
 const [hasPersonalTrainer, setHasPersonalTrainer] = useState(false);

 useEffect(() => {
  loadUserProfile();
  loadWorkoutHistory();
 }, []);

 const loadUserProfile = async () => {
  try {
   const profile = await authService.getCurrentUserProfile();
   setUserProfile(profile);
   
   // Check if user has a personal trainer
   if (profile?.tipo === 'aluno') {
    const { data: trainerData } = await supabase
     .from('professional_clients')
     .select('professional_id')
     .eq('client_id', profile?.user_id || profile?.id)
     .eq('status', 'ativo')
     .limit(1);
    
    setHasPersonalTrainer(trainerData && trainerData.length > 0);
   }
  } catch (error) {
   console.error('Erro ao carregar perfil:', error);
  }
 };

 const loadWorkoutHistory = async () => {
  try {
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) return;

   const { data, error } = await supabase
    .from('execucoes_treino')
    .select('*')
    .eq('treino_id', workout.id)
    .eq('cliente_id', user.id)
    .order('data_execucao', { ascending: false })
    .limit(5);

   if (!error && data) {
    setWorkoutHistory(data);
   }
  } catch (error) {
   console.error('Erro ao carregar histórico:', error);
  }
 };

 const handleGoBack = useCallback(() => {
  Haptics.selectionAsync();
  navigation.goBack();
 }, [navigation]);

 const handleStartWorkout = useCallback(() => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  navigation.navigate('WorkoutExecution', { workout });
 }, [navigation, workout]);

 const handleEditWorkout = useCallback(() => {
  // Check if user has personal trainer and is a student
  if (userProfile?.tipo === 'aluno' && hasPersonalTrainer) {
   Alert.alert(
    'Não é possível editar treino',
    'Você possui um personal trainer ativo. Apenas seu personal trainer pode criar e editar treinos para você.\n\nConsulte seu personal trainer para que ele faça as alterações necessárias.',
    [{ text: 'Entendi', style: 'default' }]
   );
   return;
  }

  Haptics.selectionAsync();
  navigation.navigate('CreateWorkout', { template: workout });
 }, [navigation, workout, userProfile, hasPersonalTrainer]);

 const handleDeleteWorkout = useCallback(async () => {
  // Check if user has personal trainer and is a student
  if (userProfile?.tipo === 'aluno' && hasPersonalTrainer) {
   Alert.alert(
    'Não é possível excluir treino',
    'Você possui um personal trainer ativo. Apenas seu personal trainer pode gerenciar treinos para você.\n\nConsulte seu personal trainer para que ele faça as alterações necessárias.',
    [{ text: 'Entendi', style: 'default' }]
   );
   return;
  }

  Alert.alert(
   'Excluir Treino',
   'Tem certeza que deseja excluir este treino? Esta ação não pode ser desfeita.',
   [
    { text: 'Cancelar', style: 'cancel' },
    {
     text: 'Excluir',
     style: 'destructive',
     onPress: async () => {
      try {
       setLoading(true);
       
       const { error } = await supabase
        .from('treinos')
        .delete()
        .eq('id', workout.id);

       if (error) throw error;

       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
       Alert.alert('Sucesso', 'Treino excluído com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
       ]);
      } catch (error: any) {
       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
       Alert.alert('Erro', error.message || 'Não foi possível excluir o treino');
      } finally {
       setLoading(false);
      }
     }
    }
   ]
  );
 }, [workout.id, navigation, userProfile, hasPersonalTrainer]);


 const getLevelColor = (nivel: string) => {
  switch (nivel) {
   case 'iniciante': return colors.accent.secondary;
   case 'intermediario': return '#FFB800';
   case 'avancado': return colors.semantic.error;
   default: return colors.accent.primary;
  }
 };

 const getCategoryIcon = (categoria: string) => {
  switch (categoria) {
   case 'cardio': return <Icon name='health' size={16} color={colors.semantic.error} />;
   case 'forca': return '';
   case 'flexibilidade': return '🤸';
   case 'equilibrio': return <Icon name='target' size={16} color={colors.accent.primary} />;
   case 'funcional': return '🏃';
   default: return <Icon name='settings' size={16} color={colors.text.secondary} />;
  }
 };

 const isOwner = userProfile?.user_id === workout.usuario_id;

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
       Detalhes
     </Text>
     
     {isOwner && (
      <TouchableOpacity onPress={handleEditWorkout}>
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
         {workout.exercicio}
        </Text>
        <View style={{
         flexDirection: 'row',
         alignItems: 'center',
         gap: spacing.sm,
         marginBottom: spacing.sm,
        }}>
         <Text style={{ fontSize: 16 }}>
          {getCategoryIcon(workout.categoria)}
         </Text>
         <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
          {workout.categoria}
         </Text>
        </View>
       </View>
       
       <View style={{
        backgroundColor: getLevelColor(workout.nivel),
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
       }}>
        <Text style={[
         typography.presets.caption,
         { color: colors.text.inverse, fontWeight: '600' }
        ]}>
         {workout.nivel?.toUpperCase() || 'INICIANTE'}
        </Text>
       </View>
      </View>

      {workout.descricao && (
       <View style={{
        backgroundColor: colors.surface.card,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
       }}>
        <Text style={[typography.presets.body, { lineHeight: 20 }]}>
         {workout.descricao}
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
        {isOwner ? 'Criado por você' : `Criado por ${(workout as any).creator?.nome || 'Usuário'}`}
       </Text>
       <View style={{
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.text.tertiary,
       }} />
       <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
        {new Date(workout.data_criacao).toLocaleDateString('pt-BR')}
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
       value={workout.series || 3}
       label="Séries"
       icon={<Icon name="strength" size={16} color={colors.accent.primary} />}
       accentColor={colors.accent.primary}
       size="sm"
       style={{ flex: 1 }}
      />
      <MetricCard
       value={workout.repeticoes || '10'}
       label="Repetições"
       icon={<Icon name="fitness" size={16} color={colors.accent.primary} />}
       accentColor={colors.accent.secondary}
       size="sm"
       style={{ flex: 1 }}
      />
      <MetricCard
       value={`${workout.duracao_min || 30}min`}
       label="Duração"
       icon={<Icon name="timer" size={16} color={colors.accent.primary} />}
       accentColor={colors.semantic.warning}
       size="sm"
       style={{ flex: 1 }}
      />
     </View>

     {/* YouTube Preview */}
     {workout.youtube_url && (
      <YouTubePreview
       url={workout.youtube_url}
       title="Vídeo Demonstrativo"
       style={{ marginBottom: spacing.lg }}
      />
     )}

     {/* Workout History */}
     {workoutHistory.length > 0 && (
      <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.lg }}>
       <Text style={[typography.presets.cardTitle, { marginBottom: spacing.md }]}>
         Histórico Recente
       </Text>
       
       {workoutHistory.map((execution, index) => (
        <View
         key={execution.id}
         style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: spacing.sm,
          borderBottomWidth: index < workoutHistory.length - 1 ? 1 : 0,
          borderBottomColor: colors.surface.divider,
         }}
        >
         <View>
          <Text style={[typography.presets.body, { fontWeight: '600' }]}>
           {new Date(execution.data_execucao).toLocaleDateString('pt-BR')}
          </Text>
          <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
           Finalizado: {execution.finalizado ? 'Sim' : 'Não'} • {execution.tempo_total_min || 0}min
          </Text>
         </View>
         
         <Icon name="check" size={16} color={colors.accent.secondary} />
        </View>
       ))}
      </Card>
     )}

     {/* Action Buttons */}
     <Button
      title=" Iniciar Treino"
      onPress={handleStartWorkout}
      variant="gradient"
      size="lg"
      style={{ marginBottom: spacing.md }}
     />

     {isOwner && (
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
       <Button
        title="Editar"
        onPress={handleEditWorkout}
        variant="secondary"
        size="md"
        icon={<Icon name="edit" size={14} color={colors.text.primary} />}
        style={{ flex: 1 }}
       />
       
       <Button
        title="Excluir"
        onPress={handleDeleteWorkout}
        variant="ghost"
        size="md"
        icon={<Icon name="remove" size={14} color={colors.semantic.error} />}
        loading={loading}
        style={{ 
         flex: 1,
         backgroundColor: colors.semantic.error + '20',
         borderColor: colors.semantic.error,
         borderWidth: 1,
        }}
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