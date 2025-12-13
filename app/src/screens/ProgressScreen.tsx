import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import {
 colors,
 typography,
 spacing,
 borderRadius,
 MetricCard,
 WeeklyChart,
} from '../design-system';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { authService } from '../services/authService';
import { dorService } from '../services/dorService';
import { treinoService } from '../services/treinoService';

interface ProgressScreenProps {
 navigation: any;
}

export const ProgressScreen = memo<ProgressScreenProps>(({ navigation }) => {
 const [loading, setLoading] = useState(true);
 const [streakDays, setStreakDays] = useState(0);
 const [totalWorkouts, setTotalWorkouts] = useState(0);
 const [totalHours, setTotalHours] = useState(0);
 const [averagePain, setAveragePain] = useState(0);
 const [weeklyWorkoutData, setWeeklyWorkoutData] = useState([0, 0, 0, 0, 0, 0, 0]);
 const [weeklyPainData, setWeeklyPainData] = useState([0, 0, 0, 0, 0, 0, 0]);

 const loadProgressData = useCallback(async () => {
  try {
   setLoading(true);
   
   // Carregar treinos
   const treinos = await treinoService.listarTreinos();
   const treinosCompletos = treinos.filter(t => t.status === 'completed');
   
   // Calcular métricas gerais
   setTotalWorkouts(treinosCompletos.length);
   setTotalHours(treinosCompletos.length * 0.5); // 30min por treino
   
   // Calcular streak (sequência de dias consecutivos)
   const hoje = new Date();
   let streak = 0;
   let currentDate = new Date(hoje);
   
   while (true) {
    const dateStr = currentDate.toDateString();
    const treinoNoDia = treinosCompletos.some(t => 
     new Date(t.data_execucao || t.data_criacao).toDateString() === dateStr
    );
    if (treinoNoDia) {
     streak++;
     currentDate.setDate(currentDate.getDate() - 1);
    } else {
     break;
    }
   }
   setStreakDays(streak);
   
   // Calcular dados semanais de treinos (últimos 7 dias)
   const weeklyWorkouts = [0, 0, 0, 0, 0, 0, 0];
   for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toDateString();
    const treinosNoDia = treinosCompletos.filter(t => 
     new Date(t.data_execucao || t.data_criacao).toDateString() === dateStr
    ).length;
    weeklyWorkouts[i] = treinosNoDia;
   }
   setWeeklyWorkoutData(weeklyWorkouts);
   
   // Carregar dados de dor
   try {
    const dorData = await dorService.listarHistoricoDor();
    
    // Calcular dor média
    if (dorData.length > 0) {
     const somaDoNivel = dorData.reduce((sum, registro) => sum + (registro.nivel_dor || registro.intensidade || 0), 0);
     const media = somaDoNivel / dorData.length;
     setAveragePain(parseFloat(media.toFixed(1)));
    }
    
    // Calcular dados semanais de dor (últimos 7 dias)
    const weeklyPain = [0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 7; i++) {
     const date = new Date();
     date.setDate(date.getDate() - (6 - i));
     const dateStr = date.toISOString().split('T')[0];
     
     const registrosNoDia = dorData.filter(r => 
      (r.data_registro || r.updated_at).startsWith(dateStr)
     );
     
     if (registrosNoDia.length > 0) {
      const mediaDia = registrosNoDia.reduce((sum, r) => sum + (r.nivel_dor || r.intensidade || 0), 0) / registrosNoDia.length;
      weeklyPain[i] = parseFloat(mediaDia.toFixed(1));
     }
    }
    setWeeklyPainData(weeklyPain);
   } catch (error) {
    console.log('Nenhum dado de dor encontrado');
   }
   
  } catch (error) {
   console.error('Erro ao carregar dados de progresso:', error);
   Alert.alert('Erro', 'Não foi possível carregar os dados de progresso');
  } finally {
   setLoading(false);
  }
 }, []);

 useEffect(() => {
  loadProgressData();
 }, [loadProgressData]);

 const handleGoBack = useCallback(() => {
  Haptics.selectionAsync();
  navigation.goBack();
 }, [navigation]);

 const handleNotificationPress = useCallback(() => {
  Haptics.selectionAsync();
  // Implementar notificações futuramente
  Alert.alert('Em breve', 'Notificações em desenvolvimento');
 }, []);

 // Determinar cor da dor baseada no nível
 const painColor = useMemo(() => {
  if (averagePain <= 3) return colors.accent.secondary; // Verde - baixa
  if (averagePain <= 6) return colors.semantic.warning; // Amarelo - média
  return colors.semantic.error; // Vermelho - alta
 }, [averagePain]);

 if (loading) {
  return (
   <LinearGradient
    colors={[colors.background.primary, colors.background.secondary]}
    style={{ flex: 1 }}
   >
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
     <Text style={typography.presets.body}>Carregando progresso...</Text>
    </View>
   </LinearGradient>
  );
 }

 return (
  <ScreenWrapper navigation={navigation}>
   <LinearGradient
    colors={[colors.background.primary, colors.background.secondary]}
    style={{ flex: 1 }}
   >
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
      <TouchableOpacity onPress={handleGoBack}>
       <Text style={{ fontSize: 24, color: colors.text.primary }}>←</Text>
      </TouchableOpacity>
      
      <View style={{ alignItems: 'center' }}>
       <Text style={typography.presets.screenTitle}>
        Seu Progresso
       </Text>
       <Text style={[typography.presets.body, { color: colors.text.secondary }]}>
        Acompanhe sua evolução
       </Text>
      </View>
      
      <TouchableOpacity
       onPress={handleNotificationPress}
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
       <Text style={{ fontSize: 20 }}>🔔</Text>
      </TouchableOpacity>
     </View>

     {/* Grid de Métricas 2x2 */}
     <View style={{
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
     }}>
      <View style={{
       flex: 1,
       gap: spacing.sm,
      }}>
       {/* Card 1: Streak */}
       <MetricCard
        value={streakDays}
        label="Dias de sequência"
        icon={<Ionicons name="flame-outline" size={16} color={colors.semantic.error} />}
        accentColor={colors.accent.tertiary} // Laranja/fogo
        size="md"
       />
       
       {/* Card 3: Tempo Total */}
       <MetricCard
        value={`${totalHours}h`}
        label="Tempo total"
        icon={<Ionicons name="time-outline" size={16} color={colors.accent.primary} />}
        accentColor={colors.semantic.info} // Azul
        size="md"
       />
      </View>
      
      <View style={{
       flex: 1,
       gap: spacing.sm,
      }}>
       {/* Card 2: Treinos Concluídos */}
       <MetricCard
        value={totalWorkouts}
        label="Treinos concluídos"
        icon={<Text style={{ fontSize: 20 }}>✓</Text>}
        accentColor={colors.accent.secondary} // Verde
        size="md"
       />
       
       {/* Card 4: Dor Média */}
       <MetricCard
        value={averagePain}
        label="Dor média (EVA)"
        icon={<Ionicons name="analytics-outline" size={16} color={colors.accent.primary} />}
        accentColor={painColor} // Cor baseada no nível
        size="md"
       />
      </View>
     </View>

     {/* Evolução dos Treinos */}
     <WeeklyChart
      data={weeklyWorkoutData}
      title="Evolução dos Treinos"
      accentColor={colors.accent.secondary}
     />

     {/* Nível de Dor (EVA) */}
     <WeeklyChart
      data={weeklyPainData}
      title="Nível de Dor (EVA)"
      accentColor={colors.semantic.error}
     />

     {/* Espaçamento final */}
     <View style={{ height: spacing.xl }} />
    </ScrollView>
   </LinearGradient>
  </ScreenWrapper>
 );
});