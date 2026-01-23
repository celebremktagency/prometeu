import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import {
 colors,
 typography,
 spacing,
 borderRadius,
 Button,
 Card,
 MetricCard,
} from '../design-system';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { treinoService } from '../services/treinoService';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';

interface CalendarScreenProps {
 navigation: any;
}

interface DayData {
 date: Date;
 dayNumber: number;
 dayName: string;
 workouts: any[];
 isToday: boolean;
 isCurrentMonth: boolean;
}

export const CalendarScreen = memo<CalendarScreenProps>(({ navigation }) => {
 const [currentDate, setCurrentDate] = useState(new Date());
 const [treinos, setTreinos] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
 const [userType, setUserType] = useState<string>('');
 const [hasPersonalTrainer, setHasPersonalTrainer] = useState(false);

 const loadData = useCallback(async () => {
  try {
   setLoading(true);
   
   // Carregar perfil do usuário
   const userProfile = await authService.getCurrentUserProfile();
   setUserType(userProfile?.tipo || '');
   
   // Verificar se tem personal trainer
   if (userProfile?.tipo === 'aluno') {
    const { data: trainerData } = await supabase
     .from('personal_aluno')
     .select('personal_id')
     .eq('aluno_id', userProfile?.user_id || userProfile?.id)
     .eq('ativo', true)
     .limit(1);
    
    setHasPersonalTrainer(trainerData && trainerData.length > 0);
   }
   
   const treinosData = await treinoService.listarTreinos();
   setTreinos(treinosData);
  } catch (error) {
   console.error('Erro ao carregar treinos:', error);
   Alert.alert('Erro', 'Não foi possível carregar os treinos');
  } finally {
   setLoading(false);
  }
 }, []);

 useEffect(() => {
  loadData();
 }, [loadData]);

 // Gerar dados do calendário
 const calendarData = useMemo(() => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  
  // Primeiro dia do mês
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Começar na segunda-feira da semana que contém o primeiro dia
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - ((firstDay.getDay() + 6) % 7));
  
  const weeks: DayData[][] = [];
  let currentWeek: DayData[] = [];
  
  for (let i = 0; i < 42; i++) { // 6 semanas * 7 dias
   const date = new Date(startDate);
   date.setDate(startDate.getDate() + i);
   
   const dayWorkouts = treinos.filter(treino => {
    const treinoDate = new Date(treino.data_execucao || treino.data_criacao);
    return treinoDate.toDateString() === date.toDateString();
   });
   
   const dayData: DayData = {
    date: new Date(date),
    dayNumber: date.getDate(),
    dayName: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
    workouts: dayWorkouts,
    isToday: date.toDateString() === today.toDateString(),
    isCurrentMonth: date.getMonth() === month,
   };
   
   currentWeek.push(dayData);
   
   if (currentWeek.length === 7) {
    weeks.push(currentWeek);
    currentWeek = [];
   }
  }
  
  return weeks;
 }, [currentDate, treinos]);

 const monthName = currentDate.toLocaleDateString('pt-BR', { 
  month: 'long', 
  year: 'numeric' 
 });

 const stats = useMemo(() => {
  const thisMonth = treinos.filter(t => {
   const treinoDate = new Date(t.data_criacao);
   return treinoDate.getMonth() === currentDate.getMonth() && 
       treinoDate.getFullYear() === currentDate.getFullYear();
  });
  
  const completed = thisMonth.filter(t => t.status === 'completed').length;
  const planned = thisMonth.filter(t => t.status === 'planned').length;
  const inProgress = thisMonth.filter(t => t.status === 'in_progress').length;
  
  return { completed, planned, inProgress, total: thisMonth.length };
 }, [treinos, currentDate]);

 const handleDayPress = useCallback((day: DayData) => {
  Haptics.selectionAsync();
  setSelectedDay(day);
 }, []);

 const handlePreviousMonth = useCallback(() => {
  Haptics.selectionAsync();
  setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
 }, []);

 const handleNextMonth = useCallback(() => {
  Haptics.selectionAsync();
  setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
 }, []);

 const handleCreateWorkout = useCallback(() => {
  // Verificar se o usuário pode criar treinos
  if (userType === 'aluno' && hasPersonalTrainer) {
   Alert.alert(
    'Não é possível criar treino',
    'Você possui um personal trainer ativo. Apenas seu personal trainer pode criar e atribuir treinos para você.\n\nConsulte seu personal trainer para agendar novos treinos.',
    [{ text: 'Entendi', style: 'default' }]
   );
   return;
  }
  
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  navigation.navigate('CreateWorkout', { date: selectedDay?.date });
 }, [navigation, selectedDay, userType, hasPersonalTrainer]);

 const getWorkoutStatus = (workout: any) => {
  switch (workout.status) {
   case 'completed': return { color: colors.accent.secondary, label: 'Concluído' };
   case 'in_progress': return { color: colors.semantic.warning, label: 'Em andamento' };
   case 'planned': return { color: colors.accent.primary, label: 'Planejado' };
   default: return { color: colors.text.tertiary, label: 'Indefinido' };
  }
 };

 return (
  <ScreenWrapper navigation={navigation}>
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
     <TouchableOpacity onPress={() => navigation.goBack()}>
      <Text style={{ fontSize: 24, color: colors.text.primary }}>←</Text>
     </TouchableOpacity>
     
     <Text style={typography.presets.screenTitle}>
       Calendário
     </Text>
     
     <Button
      title="Hoje"
      onPress={() => setCurrentDate(new Date())}
      variant="secondary"
      size="sm"
     />
    </View>

    <ScrollView
     style={{ flex: 1 }}
     contentContainerStyle={{
      paddingHorizontal: spacing.screenHorizontal,
      paddingBottom: spacing.screenVertical,
     }}
     showsVerticalScrollIndicator={false}
    >

     {/* Estatísticas do Mês */}
     <View style={{
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
     }}>
      <MetricCard
       value={stats.completed}
       label="Completos"
       icon={<Ionicons name="checkmark" size={20} color={colors.accent.secondary} />}
       accentColor={colors.accent.secondary}
       size="sm"
      />
      <MetricCard
       value={stats.planned}
       label="Planejados"
       icon={<Ionicons name="clipboard-outline" size={20} color={colors.accent.primary} />}
       accentColor={colors.accent.primary}
       size="sm"
      />
      <MetricCard
       value={stats.inProgress}
       label="Ativos"
       icon={<Ionicons name="time-outline" size={20} color={colors.semantic.warning} />}
       accentColor={colors.semantic.warning}
       size="sm"
      />
     </View>

     {/* Navegação do Mês */}
     <Card variant="elevated" padding="md" style={{ marginBottom: spacing.lg }}>
      <View style={{
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
      }}>
       <TouchableOpacity onPress={handlePreviousMonth}>
        <Text style={{ fontSize: 24, color: colors.accent.primary }}>‹</Text>
       </TouchableOpacity>
       
       <Text style={[
        typography.presets.sectionTitle,
        { textTransform: 'capitalize' }
       ]}>
        {monthName}
       </Text>
       
       <TouchableOpacity onPress={handleNextMonth}>
        <Text style={{ fontSize: 24, color: colors.accent.primary }}>›</Text>
       </TouchableOpacity>
      </View>
     </Card>

     {/* Calendário */}
     <Card variant="elevated" padding="md" style={{ marginBottom: spacing.lg }}>
      {/* Cabeçalho dos dias da semana */}
      <View style={{
       flexDirection: 'row',
       marginBottom: spacing.sm,
      }}>
       {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
        <View key={day} style={{ flex: 1, alignItems: 'center' }}>
         <Text style={{
          fontSize: typography.sizes.xs,
          fontWeight: '600',
          color: colors.text.secondary,
         }}>
          {day}
         </Text>
        </View>
       ))}
      </View>

      {/* Semanas */}
      {calendarData.map((week, weekIndex) => (
       <View key={weekIndex} style={{
        flexDirection: 'row',
        marginBottom: spacing.xs,
       }}>
        {week.map((day) => (
         <TouchableOpacity
          key={`${day.date.getDate()}-${day.date.getMonth()}`}
          onPress={() => handleDayPress(day)}
          style={{ flex: 1, alignItems: 'center', padding: spacing.xs }}
          activeOpacity={0.7}
         >
          <View style={{
           width: 36,
           height: 36,
           borderRadius: 18,
           alignItems: 'center',
           justifyContent: 'center',
           backgroundColor: day.isToday 
            ? colors.accent.primary
            : day.workouts.length > 0
            ? colors.accent.secondary
            : 'transparent',
           borderWidth: selectedDay?.date.toDateString() === day.date.toDateString() ? 2 : 0,
           borderColor: colors.accent.primary,
          }}>
           <Text style={{
            fontSize: typography.sizes.sm,
            fontWeight: day.isToday ? '700' : '500',
            color: day.isToday
             ? colors.text.inverse
             : day.workouts.length > 0
             ? colors.text.inverse
             : day.isCurrentMonth
             ? colors.text.primary
             : colors.text.tertiary,
           }}>
            {day.dayNumber}
           </Text>
          </View>
          
          {/* Indicador de treinos */}
          {day.workouts.length > 0 && !day.isToday && (
           <View style={{
            position: 'absolute',
            bottom: 2,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.accent.primary,
           }} />
          )}
         </TouchableOpacity>
        ))}
       </View>
      ))}
     </Card>

     {/* Detalhes do Dia Selecionado */}
     {selectedDay && (
      <Card variant="glass" padding="lg" style={{ marginBottom: spacing.lg }}>
       <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
       }}>
        <Text style={typography.presets.sectionTitle}>
         {selectedDay.date.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
         })}
        </Text>
        
        {!(userType === 'aluno' && hasPersonalTrainer) && (
         <Button
          title="Criar"
          onPress={handleCreateWorkout}
          variant="gradient"
          size="sm"
          icon={<Text style={{ fontSize: 14 }}>➕</Text>}
         />
        )}
       </View>

       {selectedDay.workouts.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
         <Ionicons name="calendar-outline" size={20} color={colors.accent.primary} />
         <Text style={[typography.presets.body, { textAlign: 'center' }]}>
          Nenhum treino planejado para este dia
         </Text>
        </View>
       ) : (
        <View>
         {selectedDay.workouts.map(workout => {
          const status = getWorkoutStatus(workout);
          return (
           <TouchableOpacity
            key={workout.id}
            style={{
             backgroundColor: colors.background.secondary,
             padding: spacing.md,
             borderRadius: borderRadius.lg,
             marginBottom: spacing.sm,
             borderLeftWidth: 4,
             borderLeftColor: status.color,
            }}
            onPress={() => navigation.navigate('WorkoutDetail', { workout })}
           >
            <View style={{
             flexDirection: 'row',
             justifyContent: 'space-between',
             alignItems: 'center',
            }}>
             <View style={{ flex: 1 }}>
              <Text style={typography.presets.cardTitle}>
               {workout.exercicio}
              </Text>
              {workout.descricao && (
               <Text style={[
                typography.presets.body,
                { marginTop: spacing.xxs }
               ]}>
                {workout.descricao}
               </Text>
              )}
             </View>
             
             <View style={{ alignItems: 'flex-end' }}>
              <Text style={{
               fontSize: typography.sizes.xs,
               color: status.color,
               fontWeight: '600',
               textTransform: 'uppercase',
              }}>
               {status.label}
              </Text>
              <Text style={{
               fontSize: typography.sizes.xs,
               color: colors.text.tertiary,
               marginTop: spacing.xxs,
              }}>
               {new Date(workout.data_criacao).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
               })}
              </Text>
             </View>
            </View>
           </TouchableOpacity>
          );
         })}
        </View>
       )}
      </Card>
     )}

     {/* Legenda */}
     <Card variant="default" padding="md">
      <Text style={[
       typography.presets.body,
       { 
        fontWeight: '600',
        marginBottom: spacing.sm,
        color: colors.text.secondary 
       }
      ]}>
       Legenda
      </Text>
      
      <View style={{ gap: spacing.xs }}>
       <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{
         width: 16,
         height: 16,
         borderRadius: 8,
         backgroundColor: colors.accent.primary,
        }} />
        <Text style={typography.presets.caption}>Hoje</Text>
       </View>
       
       <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{
         width: 16,
         height: 16,
         borderRadius: 8,
         backgroundColor: colors.accent.secondary,
        }} />
        <Text style={typography.presets.caption}>Dia com treinos</Text>
       </View>
       
       <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{
         width: 16,
         height: 16,
         borderRadius: 8,
         backgroundColor: 'transparent',
         borderWidth: 2,
         borderColor: colors.accent.primary,
        }} />
        <Text style={typography.presets.caption}>Dia selecionado</Text>
       </View>
      </View>
     </Card>

     {/* Espaçamento final */}
     <View style={{ height: spacing.xl }} />
    </ScrollView>
   </LinearGradient>
  </ScreenWrapper>
 );
});