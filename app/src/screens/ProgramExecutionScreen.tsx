import React, { memo, useState, useEffect, useCallback } from 'react';
import { 
 View, 
 Text, 
 ScrollView, 
 TouchableOpacity, 
 Alert,
 Vibration,
 FlatList
} from 'react-native';
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
 MetricCard,
 ProgressBar,
 Icon,
} from '../design-system';
import { programExecutionService, ProgramExecution, WorkoutInProgram } from '../services/programExecutionService';

interface ProgramExecutionScreenProps {
 navigation: any;
 route: {
  params: {
   template: any;
  };
 };
}

export const ProgramExecutionScreen = memo<ProgramExecutionScreenProps>(({ navigation, route }) => {
 const { template } = route.params;
 const [execution, setExecution] = useState<ProgramExecution | null>(null);
 const [workouts, setWorkouts] = useState<WorkoutInProgram[]>([]);
 const [currentWorkout, setCurrentWorkout] = useState<WorkoutInProgram | null>(null);
 const [loading, setLoading] = useState(true);
 
 // Estados para paginação
 const [currentPage, setCurrentPage] = useState(0);
 const [itemsPerPage] = useState(5); // 5 treinos por página

 useEffect(() => {
  loadProgramData();
 }, []);

 // Calcular dados da paginação
 const totalPages = Math.ceil(workouts.length / itemsPerPage);
 const startIndex = currentPage * itemsPerPage;
 const endIndex = startIndex + itemsPerPage;
 const currentPageWorkouts = workouts.slice(startIndex, endIndex);

 const handlePreviousPage = useCallback(() => {
  if (currentPage > 0) {
   setCurrentPage(currentPage - 1);
  }
 }, [currentPage]);

 const handleNextPage = useCallback(() => {
  if (currentPage < totalPages - 1) {
   setCurrentPage(currentPage + 1);
  }
 }, [currentPage, totalPages]);

 // Componente para renderizar cada treino
 const renderWorkoutItem = useCallback(({ item: workout, index }: { item: WorkoutInProgram; index: number }) => {
  const absoluteIndex = startIndex + index;
  const isCurrentWorkout = absoluteIndex === (execution?.current_workout_index || 0);
  
  return (
   <View
    style={{
     backgroundColor: isCurrentWorkout 
      ? colors.accent.primary + '20' 
      : colors.background.secondary,
     borderRadius: borderRadius.md,
     padding: spacing.md,
     marginBottom: spacing.sm,
     borderWidth: isCurrentWorkout ? 2 : 0,
     borderColor: colors.accent.primary,
    }}
   >
    <View style={{
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
    }}>
     <View style={{ flex: 1 }}>
      <Text style={[
       typography.presets.body,
       { 
        fontWeight: '600',
        marginBottom: spacing.xxs,
        color: isCurrentWorkout 
         ? colors.accent.primary 
         : colors.text.primary
       }
      ]}>
       {absoluteIndex + 1}. {workout.treino ? workout.treino.exercicio : 'Exercício não definido'}
      </Text>
      
      {workout.treino && (
       <Text style={[
        typography.presets.caption,
        { color: colors.text.secondary }
       ]}>
        {workout.treino.series} séries × {workout.treino.repeticoes} reps
        {workout.treino.carga && ` • ${workout.treino.carga}kg`}
       </Text>
      )}
     </View>
     
     <View style={{ alignItems: 'center' }}>
      {workout.completed ? (
       <View style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.accent.secondary,
        alignItems: 'center',
        justifyContent: 'center',
       }}>
        <Text style={{ fontSize: 16 }}>✓</Text>
       </View>
      ) : isCurrentWorkout ? (
       <View style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
       }}>
        <Text style={{ color: colors.text.inverse, fontSize: 12, fontWeight: '700' }}>
         {absoluteIndex + 1}
        </Text>
       </View>
      ) : (
       <View style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: colors.surface.border,
        alignItems: 'center',
        justifyContent: 'center',
       }}>
        <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>
         {absoluteIndex + 1}
        </Text>
       </View>
      )}
     </View>
    </View>
   </View>
  );
 }, [execution, startIndex]);


 const loadProgramData = async () => {
  try {
   setLoading(true);
   
   // Get workouts from template
   const programWorkouts = await programExecutionService.getProgramWorkouts(template);
   setWorkouts(programWorkouts);

   // Check if template has exercises
   if (programWorkouts.length === 0) {
    Alert.alert(
     'Programa Vazio',
     'Este programa não possui exercícios definidos. Verifique com seu personal trainer.',
     [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
    return;
   }
   
   // Check if there's an active execution for this template
   const activeExecution = await programExecutionService.getCurrentProgramExecution();
   
   if (activeExecution && activeExecution.template_id === template.id) {
    setExecution(activeExecution);
    
    // Mark completed workouts as completed
    const updatedWorkouts = programWorkouts.map((workout, index) => ({
     ...workout,
     completed: activeExecution.workouts_completed.length > index,
     completed_at: activeExecution.workouts_completed.length > index ? new Date().toISOString() : undefined
    }));
    
    setWorkouts(updatedWorkouts);
    
    // Encontrar o próximo exercício não completado
    const nextWorkout = updatedWorkouts.find(workout => !workout.completed);
    setCurrentWorkout(nextWorkout || null);
   } else {
    setCurrentWorkout(programWorkouts[0] || null);
   }
   
  } catch (error: any) {
   Alert.alert('Erro', error.message || 'Erro ao carregar programa');
  } finally {
   setLoading(false);
  }
 };

 const startProgram = async () => {
  try {
   const newExecution = await programExecutionService.startProgramExecution(template);
   setExecution(newExecution);
   
   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
   
   Alert.alert(
    'Programa Iniciado!',
    `Você começou o programa "${template.nome}".\n\nVocê fará ${workouts.length} exercícios em sequência.`,
    [{ text: 'Vamos lá!' }]
   );
   
  } catch (error: any) {
   Alert.alert('Erro', error.message || 'Erro ao iniciar programa');
  }
 };

 const startCurrentWorkout = () => {
  if (!currentWorkout?.treino) {
   Alert.alert('Erro', 'Nenhum exercício disponível');
   return;
  }

  navigation.navigate('WorkoutExecution', { 
   workout: currentWorkout.treino,
   programExecution: execution,
   workoutIndex: currentWorkout.index,
  });
 };

 const pauseProgram = async () => {
  if (!execution) return;
  
  try {
   await programExecutionService.pauseProgramExecution(execution.id);
   setExecution(prev => prev ? { ...prev, status: 'paused' } : null);
   
   Haptics.selectionAsync();
  } catch (error: any) {
   Alert.alert('Erro', error.message);
  }
 };

 const resumeProgram = async () => {
  if (!execution) return;
  
  try {
   await programExecutionService.resumeProgramExecution(execution.id);
   setExecution(prev => prev ? { ...prev, status: 'started' } : null);
   
   Haptics.selectionAsync();
  } catch (error: any) {
   Alert.alert('Erro', error.message);
  }
 };

 const cancelProgram = () => {
  if (!execution) return;

  Alert.alert(
   'Cancelar Programa',
   'Tem certeza que deseja cancelar este programa? Seu progresso será perdido.',
   [
    { text: 'Continuar', style: 'cancel' },
    { 
     text: 'Cancelar Programa', 
     style: 'destructive',
     onPress: async () => {
      try {
       await programExecutionService.cancelProgramExecution(execution.id);
       navigation.goBack();
      } catch (error: any) {
       Alert.alert('Erro', error.message);
      }
     }
    }
   ]
  );
 };

 const getProgressPercentage = () => {
  if (!execution) return 0;
  return Math.round((execution.workouts_completed.length / execution.total_workouts) * 100);
 };

 const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
   return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
 };

 if (loading) {
  return (
   <LinearGradient
    colors={[colors.background.primary, colors.background.secondary]}
    style={{ flex: 1 }}
   >
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
     <Text style={typography.presets.body}>Carregando programa...</Text>
    </SafeAreaView>
   </LinearGradient>
  );
 }

 return (
  <LinearGradient
   colors={[colors.background.primary, colors.background.secondary]}
   style={{ flex: 1 }}
  >
   <SafeAreaView style={{ flex: 1 }}>
    {/* Header */}
    <View style={{
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     paddingHorizontal: spacing.screenHorizontal,
     paddingVertical: spacing.screenVertical,
    }}>
     <TouchableOpacity onPress={() => navigation.goBack()}>
      <Text style={{ fontSize: 24, color: colors.text.primary }}>←</Text>
     </TouchableOpacity>
     
     <Text style={[typography.presets.screenTitle, { textAlign: 'center', flex: 1 }]}>
      {template.nome}
     </Text>
     
     {execution && (
      <TouchableOpacity onPress={cancelProgram}>
       <Icon name="close" size={16} color={colors.semantic.error} />
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
     {/* Program Info */}
     <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.lg }}>
      <Text style={[typography.presets.sectionTitle, { marginBottom: spacing.sm }]}>
       Informações do Programa
      </Text>
      
      <Text style={[typography.presets.body, { marginBottom: spacing.sm, color: colors.text.secondary }]}>
       {template.descricao || template.objetivo}
      </Text>
      
      <View style={{
       flexDirection: 'row',
       gap: spacing.md,
       flexWrap: 'wrap',
      }}>
       <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
         {template.nivel_dificuldade}
       </Text>
       <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
         {template.duracao_estimada_min}min total
       </Text>
       <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
         {workouts.length} exercícios
       </Text>
      </View>
     </Card>

     {/* Progress */}
     {execution && (
      <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.lg }}>
       <Text style={[typography.presets.sectionTitle, { marginBottom: spacing.md }]}>
        Progresso
       </Text>
       
       <ProgressBar 
        current={getProgressPercentage()}
        total={100}
        accentColor={colors.accent.secondary}
        label="Progresso"
       />
       
       <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
       }}>
        <Text style={[typography.presets.body, { fontWeight: '600' }]}>
         {execution.workouts_completed.length} de {execution.total_workouts} completos
        </Text>
        <Text style={[typography.presets.body, { color: colors.accent.secondary }]}>
         {getProgressPercentage()}%
        </Text>
       </View>

       <View style={{
        flexDirection: 'row',
        gap: spacing.sm,
       }}>
        <MetricCard
         value={execution.workouts_completed.length}
         label="Completos"
         icon={<Icon name="check" size={16} color={colors.accent.secondary} />}
         accentColor={colors.accent.secondary}
         size="sm"
         style={{ flex: 1 }}
        />
        <MetricCard
         value={execution.total_workouts - execution.workouts_completed.length}
         label="Restantes"
         icon={<Icon name="timer" size={16} color={colors.accent.primary} />}
         accentColor={colors.accent.primary}
         size="sm"
         style={{ flex: 1 }}
        />
       </View>
      </Card>
     )}

     {/* Current Workout */}
     {currentWorkout && currentWorkout.treino && !currentWorkout.completed && (
      <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.lg }}>
       <Text style={[typography.presets.sectionTitle, { marginBottom: spacing.md }]}>
        {execution ? ' Próximo Exercício' : ' Primeiro Exercício'}
       </Text>
       
       <View style={{
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
       }}>
        <View style={{
         flexDirection: 'row',
         justifyContent: 'space-between',
         alignItems: 'flex-start',
         marginBottom: spacing.xs,
        }}>
         <Text style={[typography.presets.cardTitle, { flex: 1 }]}>
          {currentWorkout.treino.exercicio}
         </Text>
         <View style={{
          paddingHorizontal: spacing.xs,
          paddingVertical: 2,
          backgroundColor: execution ? colors.accent.primary : colors.accent.secondary,
          borderRadius: borderRadius.sm,
         }}>
          <Text style={[
           typography.presets.caption, 
           { 
            color: 'white',
            fontWeight: '600',
            fontSize: 11
           }
          ]}>
           {currentWorkout.index + 1}/{workouts.length}
          </Text>
         </View>
        </View>
        
        {currentWorkout.treino.descricao && (
         <Text style={[
          typography.presets.body, 
          { 
           color: colors.text.secondary,
           marginBottom: spacing.xs
          }
         ]}>
          {currentWorkout.treino.descricao}
         </Text>
        )}
        
        <View style={{
         flexDirection: 'row',
         gap: spacing.md,
        }}>
         <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
           {currentWorkout.treino.series}x{currentWorkout.treino.repeticoes}
         </Text>
         <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
           {currentWorkout.treino.duracao_min}min
         </Text>
         <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
           {currentWorkout.treino.nivel_dificuldade}
         </Text>
        </View>
       </View>

       <Button
        title={execution ? "Iniciar Exercício" : "Iniciar Programa"}
        onPress={execution ? startCurrentWorkout : startProgram}
        variant="gradient"
        size="lg"
        fullWidth={true}
       />
      </Card>
     )}

     {/* Refresh Button (temporary) */}
     {execution && (
      <Button
       title="Atualizar Progresso"
       onPress={loadProgramData}
       variant="secondary"
       size="md"
       style={{ marginBottom: spacing.md }}
      />
     )}

     {/* Program Controls */}
     {execution && execution.status !== 'completed' && (
      <View style={{
       flexDirection: 'row',
       gap: spacing.sm,
       marginBottom: spacing.lg,
      }}>
       {execution.status === 'started' ? (
        <Button
         title="Pausar"
         onPress={pauseProgram}
         variant="secondary"
         size="md"
         fullWidth={true}
         style={{ flex: 1 }}
        />
       ) : (
        <Button
         title="Continuar"
         onPress={resumeProgram}
         variant="gradient"
         size="md"
         fullWidth={true}
         style={{ flex: 1 }}
        />
       )}
       
       <Button
        title="Cancelar"
        onPress={cancelProgram}
        variant="ghost"
        size="md"
        fullWidth={true}
        style={{ flex: 1 }}
       />
      </View>
     )}

     {/* Workouts List with Pagination */}
     <Card variant="elevated" padding="lg" style={{ marginBottom: spacing.lg }}>
      <View style={{ 
       flexDirection: 'row', 
       justifyContent: 'space-between', 
       alignItems: 'center',
       marginBottom: spacing.md 
      }}>
       <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Icon name="template" size={20} color={colors.text.primary} />
        <Text style={typography.presets.sectionTitle}>
         Lista de Exercícios
        </Text>
       </View>
       <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
        {workouts.length} exercícios • Página {currentPage + 1} de {totalPages}
       </Text>
      </View>
      
      <FlatList
       data={currentPageWorkouts}
       renderItem={renderWorkoutItem}
       keyExtractor={(_, index) => `workout-${startIndex + index}`}
       showsVerticalScrollIndicator={false}
       scrollEnabled={false}
      />
      
      {/* Controles de Paginação */}
      {totalPages > 1 && (
       <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.surface.border,
       }}>
        <Button
         title="Anterior"
         onPress={handlePreviousPage}
         variant="ghost"
         size="sm"
         disabled={currentPage === 0}
        />
        
        <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
         {currentPage + 1} / {totalPages}
        </Text>
        
        <Button
         title="Próximo"
         onPress={handleNextPage}
         variant="ghost"
         size="sm"
         disabled={currentPage === totalPages - 1}
        />
       </View>
      )}
     </Card>


     {/* Espaçamento final */}
     <View style={{ height: spacing.xl * 3 }} />
    </ScrollView>
   </SafeAreaView>
  </LinearGradient>
 );
});