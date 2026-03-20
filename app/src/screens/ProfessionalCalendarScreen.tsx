import React, { memo, useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
 colors,
 typography,
 spacing,
 borderRadius,
 Button,
 Card,
 Avatar,
} from '../design-system';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { inviteService } from '../services/inviteService';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';

interface ProfessionalCalendarScreenProps {
 navigation: any;
}

interface WorkoutSchedule {
 id: string;
 client_id: string;
 client_name: string;
 workout_name: string;
 scheduled_date: string;
 scheduled_time?: string;
 status: 'scheduled' | 'completed' | 'missed';
 workout_template_id?: string;
}

interface DaySchedule {
 date: string;
 dayName: string;
 dayNumber: number;
 isToday: boolean;
 workouts: WorkoutSchedule[];
}

export const ProfessionalCalendarScreen = memo<ProfessionalCalendarScreenProps>(({ navigation }) => {
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [user, setUser] = useState<any>(null);
 const [currentDate, setCurrentDate] = useState(new Date());
 const [weekDays, setWeekDays] = useState<DaySchedule[]>([]);
 const [selectedDay, setSelectedDay] = useState<DaySchedule | null>(null);

 // Generate current week days
 const generateWeekDays = useCallback((centerDate: Date) => {
  const days: DaySchedule[] = [];
  const startOfWeek = new Date(centerDate);
  
  // Get Monday of current week
  const dayOfWeek = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  startOfWeek.setDate(diff);

  for (let i = 0; i < 7; i++) {
   const date = new Date(startOfWeek);
   date.setDate(startOfWeek.getDate() + i);
   
   const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
   const today = new Date();
   
   days.push({
    date: date.toISOString().split('T')[0],
    dayName: dayNames[date.getDay()],
    dayNumber: date.getDate(),
    isToday: date.toDateString() === today.toDateString(),
    workouts: [],
   });
  }
  
  return days;
 }, []);

 const loadScheduledWorkouts = useCallback(async () => {
  try {
   const currentUser = await authService.getCurrentUserProfile();
   setUser(currentUser);

   // Get current week dates
   const weekStart = weekDays[0]?.date;
   const weekEnd = weekDays[6]?.date;
   
   if (!weekStart || !weekEnd) return;

   // Load scheduled workouts for this week
   const { data: scheduledWorkouts, error } = await supabase
    .from('treinos_atribuidos')
    .select('*')
    .eq('personal_id', currentUser.id)
    .gte('data_inicio', weekStart)
    .lte('data_inicio', weekEnd)
    .order('data_inicio', { ascending: true });

   if (error) {
    console.log('Erro ao carregar treinos agendados:', error);
    return;
   }

   // Buscar dados de alunos e treinos separadamente
   const alunoIds = [...new Set((scheduledWorkouts || []).map(w => w.aluno_id))];
   const treinoIds = [...new Set((scheduledWorkouts || []).map(w => w.treino_id))];

   const [{ data: alunos }, { data: treinos }] = await Promise.all([
    supabase.from('user_profiles').select('user_id, nome, email').in('user_id', alunoIds.length ? alunoIds : ['']),
    supabase.from('treinos').select('id, nome').in('id', treinoIds.length ? treinoIds : [''])
   ]);

   // Group workouts by date
   const workoutsByDate: { [date: string]: WorkoutSchedule[] } = {};
   
   (scheduledWorkouts || []).forEach(item => {
    const date = item.data_inicio.split('T')[0];
    if (!workoutsByDate[date]) {
     workoutsByDate[date] = [];
    }
    
    workoutsByDate[date].push({
     id: item.id,
     client_id: item.aluno_id,
     client_name: alunos?.find(a => a.user_id === item.aluno_id)?.nome || 'Cliente',
     workout_name: treinos?.find(t => t.id === item.treino_id)?.nome || 'Treino',
     scheduled_date: item.data_inicio,
     scheduled_time: item.horario_sugerido,
     status: item.status === 'completed' ? 'completed' : 'scheduled',
     workout_template_id: item.treino_id,
    });
   });

   // Update week days with workouts
   const updatedWeekDays = weekDays.map(day => ({
    ...day,
    workouts: workoutsByDate[day.date] || [],
   }));
   
   setWeekDays(updatedWeekDays);
   
   // Set today as selected day by default
   const today = updatedWeekDays.find(day => day.isToday);
   if (today) {
    setSelectedDay(today);
   }

  } catch (error: any) {
   console.error('Erro ao carregar treinos agendados:', error);
  }
 }, [weekDays]);

 const loadData = useCallback(async () => {
  try {
   setLoading(true);
   
   // Generate week days first
   const days = generateWeekDays(currentDate);
   setWeekDays(days);
   
  } catch (error: any) {
   Alert.alert('Erro', 'Não foi possível carregar o calendário');
  } finally {
   setLoading(false);
  }
 }, [currentDate, generateWeekDays]);

 // Load scheduled workouts when week days change
 useEffect(() => {
  if (weekDays.length > 0) {
   loadScheduledWorkouts();
  }
 }, [loadScheduledWorkouts]);

 useEffect(() => {
  loadData();
 }, [loadData]);

 const onRefresh = useCallback(async () => {
  setRefreshing(true);
  await loadData();
  setRefreshing(false);
 }, [loadData]);

 const handleGoBack = useCallback(() => {
  Haptics.selectionAsync();
  navigation.goBack();
 }, [navigation]);

 const handlePreviousWeek = useCallback(() => {
  Haptics.selectionAsync();
  const newDate = new Date(currentDate);
  newDate.setDate(currentDate.getDate() - 7);
  setCurrentDate(newDate);
 }, [currentDate]);

 const handleNextWeek = useCallback(() => {
  Haptics.selectionAsync();
  const newDate = new Date(currentDate);
  newDate.setDate(currentDate.getDate() + 7);
  setCurrentDate(newDate);
 }, [currentDate]);

 const handleDayPress = useCallback((day: DaySchedule) => {
  Haptics.selectionAsync();
  setSelectedDay(day);
 }, []);

 const handleClientPress = useCallback((workout: WorkoutSchedule) => {
  Haptics.selectionAsync();
  // Navigate to client details with workout context
  navigation.navigate('ClientDetails', { 
   clientId: workout.client_id,
   workoutId: workout.id 
  });
 }, [navigation]);

 const renderDayCard = useCallback((day: DaySchedule) => (
  <TouchableOpacity
   key={day.date}
   onPress={() => handleDayPress(day)}
   activeOpacity={0.8}
  >
   <Card 
    variant={day.isToday ? "elevated" : selectedDay?.date === day.date ? "elevated" : "glass"}
    padding="sm"
    style={{
     marginRight: spacing.xs,
     minWidth: 70,
     alignItems: 'center',
     borderWidth: selectedDay?.date === day.date ? 2 : 0,
     borderColor: selectedDay?.date === day.date ? colors.accent.primary : 'transparent',
    }}
   >
    <Text style={[
     typography.presets.caption,
     { 
      color: day.isToday ? colors.accent.primary : colors.text.secondary,
      fontWeight: day.isToday ? '700' : '500'
     }
    ]}>
     {day.dayName}
    </Text>
    <Text style={[
     typography.presets.body,
     { 
      fontWeight: day.isToday ? '700' : '600',
      color: day.isToday ? colors.accent.primary : colors.text.primary
     }
    ]}>
     {day.dayNumber}
    </Text>
    {day.workouts.length > 0 && (
     <View style={{
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent.secondary,
      marginTop: spacing.xxs,
     }} />
    )}
   </Card>
  </TouchableOpacity>
 ), [selectedDay, handleDayPress]);

 const renderWorkoutItem = useCallback((workout: WorkoutSchedule) => (
  <TouchableOpacity
   key={workout.id}
   onPress={() => handleClientPress(workout)}
   activeOpacity={0.8}
  >
   <Card variant="elevated" padding="md" style={{ marginBottom: spacing.sm }}>
    <View style={{
     flexDirection: 'row',
     alignItems: 'center',
     gap: spacing.md,
    }}>
     <Avatar
      name={workout.client_name}
      size="sm"
      showBorder={false}
     />
     
     <View style={{ flex: 1 }}>
      <Text style={[typography.presets.cardTitle, { marginBottom: spacing.xxs }]}>
       {workout.client_name}
      </Text>
      <Text style={[typography.presets.body, { color: colors.text.secondary, marginBottom: spacing.xxs }]}>
       {workout.workout_name}
      </Text>
      {workout.scheduled_time && (
       <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
        ⏰ {workout.scheduled_time}
       </Text>
      )}
     </View>
     
     <View style={{
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      backgroundColor: 
       workout.status === 'completed' ? colors.accent.secondary :
       workout.status === 'missed' ? colors.semantic.error :
       colors.semantic.warning,
      borderRadius: borderRadius.sm,
     }}>
      <Text style={[
       typography.presets.caption,
       { 
        color: colors.text.inverse,
        fontSize: 10,
        fontWeight: '600'
       }
      ]}>
       {workout.status === 'completed' ? 'Completo' : 
        workout.status === 'missed' ? 'Perdido' : 'Agendado'}
      </Text>
     </View>
    </View>
   </Card>
  </TouchableOpacity>
 ), [handleClientPress]);

 const currentMonthYear = currentDate.toLocaleDateString('pt-BR', { 
  month: 'long', 
  year: 'numeric' 
 });

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
       Calendário
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
     refreshControl={
      <RefreshControl
       refreshing={refreshing}
       onRefresh={onRefresh}
       tintColor={colors.accent.primary}
      />
     }
    >
     {/* Month/Year and Navigation */}
     <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
     }}>
      <TouchableOpacity onPress={handlePreviousWeek}>
       <Text style={{ fontSize: 24, color: colors.accent.primary }}>‹</Text>
      </TouchableOpacity>
      
      <Text style={[typography.presets.sectionTitle, { textTransform: 'capitalize' }]}>
       {currentMonthYear}
      </Text>
      
      <TouchableOpacity onPress={handleNextWeek}>
       <Text style={{ fontSize: 24, color: colors.accent.primary }}>›</Text>
      </TouchableOpacity>
     </View>

     {/* Week Days */}
     <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={{ marginBottom: spacing.lg }}
     >
      {weekDays.map(renderDayCard)}
     </ScrollView>

     {/* Selected Day Details */}
     {selectedDay && (
      <View style={{ marginBottom: spacing.lg }}>
       <Text style={[
        typography.presets.sectionTitle, 
        { marginBottom: spacing.md }
       ]}>
         {selectedDay.dayName}, {selectedDay.dayNumber} - 
        {selectedDay.workouts.length === 0 
         ? ' Nenhum treino agendado'
         : ` ${selectedDay.workouts.length} treino${selectedDay.workouts.length > 1 ? 's' : ''}`
        }
       </Text>
       
       {selectedDay.workouts.length === 0 ? (
        <Card variant="glass" padding="lg">
         <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>😌</Text>
          <Text style={[typography.presets.body, { textAlign: 'center', color: colors.text.secondary }]}>
           Dia livre! Nenhum cliente agendado para treinar.
          </Text>
         </View>
        </Card>
       ) : (
        <View>
         {selectedDay.workouts.map(renderWorkoutItem)}
        </View>
       )}
      </View>
     )}

     {/* Quick Actions */}
     <View style={{
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
     }}>
      <Button
       title=" Meus Clientes"
       onPress={() => navigation.navigate('ClientList')}
       variant="ghost"
       size="md"
       style={{ flex: 1 }}
      />
      
      <Button
       title="➕ Novo Treino"
       onPress={() => navigation.navigate('CreateWorkout')}
       variant="ghost"
       size="md"
       style={{ flex: 1 }}
      />
     </View>

     {/* Espaçamento final */}
     <View style={{ height: spacing.xl }} />
    </ScrollView>
   </LinearGradient>
  </ScreenWrapper>
 );
});