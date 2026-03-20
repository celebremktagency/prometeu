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
 Button,
 Avatar,
 StreakCard,
 MetricCard,
 WeeklyCalendar,
 NextWorkoutCard,
} from '../design-system';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { authService } from '../services/authService';
import { dorService } from '../services/dorService';
import { execucaoService } from '../services/execucaoService';
import { treinoNovoService } from '../services/treinoNovoService';
import { trainerClientService } from '../services/trainerClientService';
import { insightsService } from '../services/insightsService';
import { communityService } from '../services/communityService';
import { supabase } from '../services/supabaseClient';
import { inviteService } from '../services/inviteService';

interface HomeScreenProps {
 navigation: any;
}

export const HomeScreen = memo<HomeScreenProps>(({ navigation }) => {
 const [user, setUser] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [streakDays, setStreakDays] = useState(0);
 const [weeklyWorkouts, setWeeklyWorkouts] = useState([false, false, false, false, false, false, false]);
 const [metrics, setMetrics] = useState({
  workouts: 0,
  activeHours: 0,
  painLevel: 0,
 });
 const [treinos, setTreinos] = useState<any[]>([]);
 const [dorAtual, setDorAtual] = useState<any>(null);
 const [currentTrainer, setCurrentTrainer] = useState<any>(null);

 // Função para detectar período do dia
 const getGreeting = useCallback(() => {
  const hour = new Date().getHours();
  if (hour < 6) return 'Boa madrugada';
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
 }, []);

 const greeting = useMemo(() => getGreeting(), [getGreeting]);

 const loadUserData = useCallback(async () => {
  try {
   setLoading(true);
   const userProfile = await authService.getCurrentUserProfile();
   setUser(userProfile);
   
   // Redirecionar personal trainer para sua dashboard específica
   if (userProfile?.tipo === 'personal_trainer' || userProfile?.tipo === 'profissional') {
    navigation.replace('ProfessionalDashboard');
    return;
   }
   
   // Carregar dados de dor atual
   try {
    const dorData = await dorService.obterDorAtual();
    setDorAtual(dorData);
    setMetrics(prev => ({ 
     ...prev, 
     painLevel: dorData?.nivel_dor_atual || 0 
    }));
   } catch (error) {
    console.log('Nenhuma dor registrada');
   }
   
   // Primeiro verificar se tem personal trainer
   const currentProfessional = await inviteService.getMyProfessional(userProfile.id);
   setCurrentTrainer(currentProfessional);

   if (currentProfessional) {
    // Se tem personal, buscar treinos atribuídos pelo personal
    try {
     const { data: treinosAtribuidos, error: atribuidosError } = await supabase
      .from('treinos_atribuidos')
      .select('*')
      .eq('aluno_id', userProfile.id || userProfile.user_id)
      .eq('status', 'ativo')
      .order('created_at', { ascending: false });

     if (!atribuidosError && treinosAtribuidos && treinosAtribuidos.length > 0) {
      const treinoIds = treinosAtribuidos.map(ta => ta.treino_id);
      const { data: treinosData } = await supabase
       .from('treinos')
       .select('*')
       .in('id', treinoIds);

      const treinosDoPersonal = treinosAtribuidos.map(ta => ({
       ...(treinosData?.find(t => t.id === ta.treino_id) || {}),
       atribuido_em: ta.created_at,
       observacoes_personal: ta.observacoes,
       data_inicio: ta.data_inicio,
       status_atribuicao: ta.status
      }));
      setTreinos(treinosDoPersonal);
     }
    } catch (error) {
     console.log('Erro ao carregar treinos do personal:', error);
     setTreinos([]);
    }
   } else {
    // Se não tem personal, buscar treinos públicos da biblioteca
    try {
     const { data: bibliotecaTreinos, error: bibliotecaError } = await supabase
      .from('treinos')
      .select('*')
      .eq('is_publico', true)
      .order('created_at', { ascending: false });
     
     if (!bibliotecaError && bibliotecaTreinos) {
      const treinosFiltrados = bibliotecaTreinos.slice(0, 10);
      setTreinos(treinosFiltrados);
     }
    } catch (error) {
     console.log('Erro ao carregar treinos da biblioteca:', error);
     setTreinos([]);
    }
   }
    
    // Para métricas, buscar execuções reais de treino do usuário
    try {
     const { data: historicoCompleto } = await execucaoService.buscarHistoricoUsuario(userProfile.id, 1, 100);
     const estatisticas = await execucaoService.obterEstatisticas(userProfile.id);
     const execucoes = historicoCompleto; // Compatibilidade
     
     if (execucoes && execucoes.length > 0) {
      const execucoesEstaSemana = execucoes.filter(exec => {
       if (exec.status !== 'concluido' || !exec.data_execucao) return false;
       const execDate = new Date(exec.data_execucao);
       const oneWeekAgo = new Date();
       oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
       return execDate > oneWeekAgo;
      });
      
      // Usar estatísticas calculadas pelo novo serviço (mais preciso)
      setMetrics(prev => ({ 
       ...prev, 
       workouts: estatisticas.treinosConcluidos,
       activeHours: Math.round((estatisticas.totalMinutos / 60) * 10) / 10
      }));
      
      // Usar streak calculado pelo novo serviço (mais preciso)
      setStreakDays(estatisticas.streakAtual);
      
      // Calcular calendário semanal baseado em execuções reais (últimos 7 dias)
      const weeklyData = [];
      
      // Começar de domingo (início da semana)
      const inicioSemana = new Date();
      const hoje = new Date();
      inicioSemana.setDate(hoje.getDate() - hoje.getDay()); // Volta para o domingo
      
      for (let i = 0; i < 7; i++) {
       const date = new Date(inicioSemana);
       date.setDate(inicioSemana.getDate() + i);
       const dateStr = date.toDateString();
       const temExecucao = execucoes.some(exec => 
        exec.status === 'concluido' && exec.data_execucao &&
        new Date(exec.data_execucao).toDateString() === dateStr
       );
       weeklyData.push(temExecucao);
      }
      setWeeklyWorkouts(weeklyData);
      console.log('🗓️ Dados do calendário semanal (NOVA ESTRUTURA):', weeklyData);
      console.log('📊 Estatísticas carregadas:', estatisticas);
     }
    } catch (error) {
     console.log('Erro ao carregar histórico de execuções:', error);
    }
   
  } catch (error: any) {
   console.error('Erro ao carregar dados:', error);
   Alert.alert('Erro', 'Não foi possível carregar os dados');
  } finally {
   setLoading(false);
  }
 }, [navigation]);

 useEffect(() => {
  loadUserData();
 }, [loadUserData]);

 // Refresh data when screen comes into focus (after workout)
 useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
   // Reload user data when returning to this screen
   loadUserData();
  });

  return unsubscribe;
 }, [navigation, loadUserData]);

 const handleNotificationPress = useCallback(() => {
  Haptics.selectionAsync();
  Alert.alert('Em breve', 'Notificações em desenvolvimento');
 }, []);

 const handleLogout = useCallback(async () => {
  try {
   await authService.signOut();
  } catch (error: any) {
   Alert.alert('Erro', error.message);
  }
 }, []);

 const handleProfilePress = useCallback(() => {
  Haptics.selectionAsync();
  navigation.navigate('Profile');
 }, [navigation]);

 const handleStartWorkout = useCallback((treino?: any) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  if (treino) {
   navigation.navigate('WorkoutExecution', { workout: treino });
  }
 }, [navigation]);

 const handleMetricPress = useCallback((metric: string) => {
  Haptics.selectionAsync();
  navigation.navigate('Progress', { focusMetric: metric });
 }, [navigation]);

 const handleFindProfessional = useCallback(() => {
  Haptics.selectionAsync();
  navigation.navigate('ConnectPersonal');
 }, [navigation]);

 if (loading) {
  return (
   <LinearGradient
    colors={[colors.background.primary, colors.background.secondary]}
    style={{ flex: 1 }}
   >
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
     <Text style={typography.presets.body}>Carregando...</Text>
    </View>
   </LinearGradient>
  );
 }

 if (!user) {
  return (
   <LinearGradient
    colors={[colors.background.primary, colors.background.secondary]}
    style={{ flex: 1 }}
   >
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
     <Text style={typography.presets.body}>Usuário não encontrado</Text>
     <Button title="Fazer Login" onPress={handleLogout} variant="gradient" />
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
      {/* Avatar */}
      <Avatar
       name={user.nome || 'Usuário'}
       size="md"
       onPress={handleProfilePress}
      />

      {/* Actions */}
      <View style={{
       flexDirection: 'row',
       gap: spacing.sm,
      }}>
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
        <Ionicons name="notifications-outline" size={20} color={colors.text.primary} />
       </TouchableOpacity>

       <TouchableOpacity
        onPress={handleLogout}
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
        <Ionicons name="log-out-outline" size={20} color={colors.semantic.error} />
       </TouchableOpacity>
      </View>
     </View>

     {/* Saudação */}
     <View style={{ marginBottom: spacing.xl }}>
      <Text style={[
       typography.presets.body,
       { marginBottom: spacing.xxs }
      ]}>
       {greeting},
      </Text>
      <Text style={[
       typography.presets.screenTitle,
       { marginBottom: spacing.xxs }
      ]}>
{user.nome?.split(' ')[0] || 'Usuário'} 👋
      </Text>
      <Text style={typography.presets.body}>
       {user.tipo === 'personal_trainer' ? 'Personal Trainer' : 'Aluno'}
      </Text>
     </View>

     {/* Streak Card */}
     <StreakCard
      streakDays={streakDays}
      title="Sequência ativa"
      subtitle="Continue assim! Você está no caminho certo."
      animated
     />

     {/* Resumo Semanal */}
     <View style={{ marginBottom: spacing.lg }}>
      <Text style={[
       typography.presets.sectionTitle,
       { marginBottom: spacing.md }
      ]}>
       Resumo Semanal
      </Text>
      
      <View style={{
       flexDirection: 'row',
       gap: spacing.sm,
      }}>
       <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleMetricPress('workouts')}
        style={{ flex: 1 }}
       >
        <MetricCard
         value={metrics.workouts}
         label="Treinos"
         icon={<Ionicons name="fitness-outline" size={24} color={colors.accent.secondary} />}
         accentColor={colors.accent.secondary}
         size="sm"
        />
       </TouchableOpacity>

       <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleMetricPress('time')}
        style={{ flex: 1 }}
       >
        <MetricCard
         value={`${metrics.activeHours}h`}
         label="Ativas"
         icon={<Ionicons name="time-outline" size={24} color={colors.accent.primary} />}
         accentColor={colors.semantic.info}
         size="sm"
        />
       </TouchableOpacity>

       <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleMetricPress('pain')}
        style={{ flex: 1 }}
       >
        <MetricCard
         value={metrics.painLevel}
         label="Dor"
         sublabel="EVA"
         icon={<Ionicons name="stats-chart-outline" size={16} color={colors.accent.primary} />}
         accentColor={
          metrics.painLevel <= 3
           ? colors.accent.secondary
           : metrics.painLevel <= 6
           ? colors.semantic.warning
           : colors.semantic.error
         }
         size="sm"
        />
       </TouchableOpacity>
      </View>
     </View>

     {/* Calendário Semanal */}
     <WeeklyCalendar
      workoutDays={weeklyWorkouts}
      animated
     />

     {/* Sugestão de Ação */}
     <View style={{ marginBottom: spacing.lg }}>
      <Text style={[
       typography.presets.sectionTitle,
       { marginBottom: spacing.md }
      ]}>
       Escolha seu Treino
      </Text>
      
      <View style={{
       backgroundColor: colors.background.elevated,
       borderRadius: borderRadius.lg,
       padding: spacing.lg,
       borderWidth: 1,
       borderColor: colors.surface.border,
      }}>
       <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
       }}>
        <Ionicons name="barbell-outline" size={16} color={colors.accent.primary} />
        <View style={{ flex: 1 }}>
         <Text style={[typography.presets.cardTitle, { marginBottom: spacing.xxs }]}>
          Pronto para Treinar?
         </Text>
         <Text style={[typography.presets.body, { color: colors.text.secondary }]}>
          {currentTrainer 
           ? 'Veja os treinos que seu personal prescreveu'
           : 'Escolha um exercício ou programa da biblioteca'
          }
         </Text>
        </View>
       </View>
       
       {currentTrainer ? (
        <Button
         title=" Ver Treinos do Personal"
         onPress={() => navigation.navigate('Progress')}
         variant="gradient"
         size="sm"
         fullWidth={true}
        />
       ) : (
        <View style={{
         flexDirection: 'row',
         gap: spacing.sm,
        }}>
         <Button
          title=" Exercícios"
          onPress={() => navigation.navigate('WorkoutLibrary')}
          variant="gradient"
          size="sm"
          fullWidth={true}
          style={{ flex: 1 }}
         />
         <Button
          title=" Programas"
          onPress={() => navigation.navigate('WorkoutTemplates')}
          variant="secondary"
          size="sm"
          fullWidth={true}
          style={{ flex: 1 }}
         />
        </View>
       )}
      </View>
     </View>

     {/* Lista de Treinos */}
     <View style={{ marginBottom: spacing.lg }}>
      <View style={{
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       marginBottom: spacing.md,
      }}>
       <View>
        <Text style={[typography.presets.sectionTitle]}>
         {currentTrainer ? 'Treinos do seu Personal' : 'Exercícios Disponíveis'}
        </Text>
        <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
         {currentTrainer 
          ? `Prescritos por ${currentTrainer.nome}`
          : 'Exercícios da biblioteca para você escolher'
         }
        </Text>
       </View>
       <TouchableOpacity onPress={() => navigation.navigate(currentTrainer ? 'Progress' : 'WorkoutLibrary')}>
        <Text style={[
         typography.presets.body,
         { 
          color: colors.accent.primary,
          fontWeight: '600' 
         }
        ]}>
         Ver Todos
        </Text>
       </TouchableOpacity>
      </View>

      {treinos.length === 0 ? (
       <View style={{
        padding: spacing.lg,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.surface.border,
        borderStyle: 'dashed'
       }}>
        <Ionicons name="library-outline" size={48} color={colors.accent.secondary} style={{ marginBottom: spacing.sm }} />
        <Text style={[typography.presets.cardTitle, { textAlign: 'center', marginBottom: spacing.xs }]}>
         {currentTrainer ? 'Nenhum treino prescrito' : 'Carregando exercícios'}
        </Text>
        <Text style={[typography.presets.body, { textAlign: 'center', marginBottom: spacing.md, color: colors.text.secondary }]}>
         {currentTrainer 
          ? 'Seu personal trainer ainda não prescreveu treinos para você'
          : 'Aguarde enquanto carregamos os exercícios da biblioteca'
         }
        </Text>
        <Button
         title={currentTrainer ? "Falar com Personal" : "Ir para Biblioteca"}
         onPress={() => navigation.navigate(currentTrainer ? 'Profile' : 'WorkoutLibrary')}
         variant="gradient"
         size="sm"
        />
       </View>
      ) : (
       <View style={{ gap: spacing.sm }}>
        {treinos.slice(0, 4).map((treino, index) => (
         <TouchableOpacity
          key={treino.id}
          onPress={() => navigation.navigate('WorkoutDetail', { workout: treino })}
          style={{
           backgroundColor: colors.background.elevated,
           borderRadius: borderRadius.lg,
           padding: spacing.md,
           borderWidth: 1,
           borderColor: colors.surface.border,
          }}
         >
          <View style={{
           flexDirection: 'row',
           justifyContent: 'space-between',
           alignItems: 'flex-start',
           marginBottom: spacing.xs,
          }}>
           <Text style={[typography.presets.cardTitle, { flex: 1 }]}>
            {treino?.exercicio || treino?.nome}
           </Text>
           <View style={{
            paddingHorizontal: spacing.xs,
            paddingVertical: 2,
            backgroundColor: colors.accent.secondary,
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
             {currentTrainer ? 'Personal' : 'Biblioteca'}
            </Text>
           </View>
          </View>
          
          {treino?.descricao && (
           <Text style={[
            typography.presets.body, 
            { 
             color: colors.text.secondary,
             marginBottom: spacing.xs
            }
           ]}>
            {treino.descricao}
           </Text>
          )}
          
          <View style={{
           flexDirection: 'row',
           gap: spacing.md,
          }}>
           <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
             {treino?.series || 3}x{treino?.repeticoes || '10'}
           </Text>
           <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
            {treino?.duracao_min || treino?.duracao_estimada_min || 30}min
           </Text>
           <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
             {treino?.nivel || treino?.nivel_dificuldade || 'iniciante'}
           </Text>
          </View>
         </TouchableOpacity>
        ))}
        
        {treinos.length > 4 && (
         <TouchableOpacity
          onPress={() => navigation.navigate(currentTrainer ? 'Progress' : 'WorkoutLibrary')}
          style={{
           padding: spacing.md,
           alignItems: 'center',
           backgroundColor: colors.background.elevated,
           borderRadius: borderRadius.lg,
           borderWidth: 1,
           borderColor: colors.surface.border,
          }}
         >
          <Text style={[
           typography.presets.body,
           { color: colors.accent.primary, fontWeight: '600' }
          ]}>
           {currentTrainer 
            ? `Ver todos os treinos prescritos (+${treinos.length - 4})`
            : `Ver biblioteca completa (+${treinos.length - 4} exercícios)`
           }
          </Text>
         </TouchableOpacity>
        )}
       </View>
      )}
     </View>

     {/* Seções Principais */}
     <View style={{ marginBottom: spacing.lg }}>
      <Text style={[typography.presets.sectionTitle, { marginBottom: spacing.md }]}>
       O que você quer fazer?
      </Text>
      
      <View style={{
       flexDirection: 'row',
       gap: spacing.sm,
       marginBottom: spacing.md,
      }}>
       <Button
        title=" Exercícios"
        onPress={() => navigation.navigate('WorkoutLibrary')}
        variant="gradient"
        size="md"
        fullWidth={true}
        style={{ flex: 1 }}
       />
       <Button
        title=" Programas"
        onPress={() => navigation.navigate('WorkoutTemplates')}
        variant="gradient"
        size="md"
        fullWidth={true}
        style={{ flex: 1 }}
       />
      </View>
      
      <Text style={[typography.presets.caption, { textAlign: 'center', color: colors.text.secondary }]}>
       Exercícios individuais ou programas completos
      </Text>
     </View>

     {/* Acesso rápido */}
     <View style={{
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
     }}>
      <Button
       title="Comunidade"
       onPress={() => navigation.navigate('Community')}
       variant="secondary"
       size="sm"
       fullWidth={true}
       style={{ flex: 1 }}
       icon={<Ionicons name="people-outline" size={16} color={colors.accent.primary} />}
      />
      <Button
       title="Progresso"
       onPress={() => navigation.navigate('Progress')}
       variant="secondary"
       size="sm"
       fullWidth={true}
       style={{ flex: 1 }}
       icon={<Ionicons name="stats-chart-outline" size={16} color={colors.accent.primary} />}
      />
      <Button
       title="Perfil"
       onPress={() => navigation.navigate('Profile')}
       variant="secondary"
       size="sm"
       fullWidth={true}
       style={{ flex: 1 }}
       icon={<Ionicons name="person-outline" size={16} color={colors.text.primary} />}
      />
     </View>

     {/* DEBUG: Botões para testar nova estrutura */}
     {__DEV__ && (
      <View style={{ marginBottom: spacing.lg }}>
       <Text style={[typography.presets.sectionTitle, { marginBottom: spacing.sm }]}>
        🔧 Debug - Nova Estrutura
       </Text>
       <View style={{ gap: spacing.sm }}>
        <Button
         title="📊 Criar Execuções Demo (Nova Estrutura)"
         onPress={async () => {
          try {
           // Criar algumas execuções de exemplo na nova estrutura
           const hoje = new Date();
           for (let i = 0; i < 5; i++) {
            const dataExecucao = new Date(hoje);
            dataExecucao.setDate(hoje.getDate() - i);
            
            const execucao = await execucaoService.iniciarExecucao('treino-exemplo-id');
            if (execucao.success) {
             await execucaoService.finalizarExecucao(
              execucao.data.id,
              25 + Math.floor(Math.random() * 20), // 25-45 min
              Math.floor(Math.random() * 2) + 4,   // 4-5 estrelas
              `Treino demo ${i + 1} concluído!`
             );
            }
           }
           Alert.alert('Sucesso!', 'Execuções demo criadas na nova estrutura. Recarregue para ver.');
          } catch (error: any) {
           Alert.alert('Erro', error.message || 'Erro ao criar dados demo');
          }
         }}
         variant="secondary"
         size="sm"
         fullWidth
        />
        
        <Button
         title="🔍 Verificar Dados do BD"
         onPress={async () => {
          try {
           const estatisticas = await execucaoService.obterEstatisticas(user.id);
           const { data: historico } = await execucaoService.buscarHistoricoUsuario(user.id, 1, 10);
           
           console.log('📊 Estatísticas:', estatisticas);
           console.log('📈 Histórico:', historico);
           
           Alert.alert('Debug', 
            `Treinos: ${estatisticas.treinosConcluidos}\n` +
            `Tempo: ${estatisticas.totalMinutos}min\n` +
            `Streak: ${estatisticas.streakAtual}\n` +
            `Histórico: ${historico?.length || 0} registros\n` +
            'Ver console para detalhes'
           );
          } catch (error: any) {
           Alert.alert('Erro Debug', error.message);
          }
         }}
         variant="ghost"
         size="sm"
         fullWidth
        />
       </View>
      </View>
     )}

     {/* Área do Profissional */}
     <View style={{ marginBottom: spacing.xl }}>
      <Text style={[typography.presets.sectionTitle, { marginBottom: spacing.md }]}>
        Área Profissional
      </Text>
      
      {currentTrainer ? (
       <View style={{
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.accent.secondary,
       }}>
        <View style={{
         flexDirection: 'row',
         alignItems: 'center',
         marginBottom: spacing.sm,
        }}>
         <Ionicons name="fitness-outline" size={20} color={colors.accent.primary} style={{ marginRight: spacing.xs }} />
         <Text style={[typography.presets.cardTitle]}>
          Seu Personal: {currentTrainer.nome}
         </Text>
        </View>
        <Text style={[typography.presets.body, { color: colors.text.secondary, marginBottom: spacing.md }]}>
         {currentTrainer.email}
        </Text>
        <View style={{
         flexDirection: 'row',
         gap: spacing.sm,
        }}>
         <Button
          title="Conversar"
          onPress={() => {
           Alert.alert('Em breve', 'Chat com personal em desenvolvimento');
          }}
          variant="secondary"
          size="sm"
          style={{ flex: 1 }}
         />
         <Button
          title="Histórico"
          onPress={() => navigation.navigate('Progress')}
          variant="secondary"
          size="sm"
          style={{ flex: 1 }}
         />
        </View>
       </View>
      ) : (
       <View style={{
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.surface.border,
        alignItems: 'center',
       }}>
        <Ionicons name="link-outline" size={16} color={colors.accent.primary} />
        <Text style={[typography.presets.cardTitle, { marginBottom: spacing.xs, textAlign: 'center' }]}>
         Conecte-se com um Personal
        </Text>
        <Text style={[
         typography.presets.body, 
         { color: colors.text.secondary, marginBottom: spacing.md, textAlign: 'center' }
        ]}>
         Tenha acompanhamento profissional personalizado
        </Text>
        <Button
         title=" Encontrar Personal"
         onPress={handleFindProfessional}
         variant="gradient"
         size="md"
        />
       </View>
      )}
     </View>

     {/* Espaçamento final */}
     <View style={{ height: spacing.xl }} />
    </ScrollView>
   </LinearGradient>
  </ScreenWrapper>
 );
});