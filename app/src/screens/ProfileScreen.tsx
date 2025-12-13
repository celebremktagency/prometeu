import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
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
 ProgressBar,
 Icon,
} from '../design-system';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { authService } from '../services/authService';
import { dorService } from '../services/dorService';
import { treinoService } from '../services/treinoService';
import { streakService } from '../services/streakService';

interface ProfileScreenProps {
 navigation: any;
}

export const ProfileScreen = memo<ProfileScreenProps>(({ navigation }) => {
 const [user, setUser] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [streakDays, setStreakDays] = useState(0);
 const [totalWorkouts, setTotalWorkouts] = useState(0);
 const [totalHours, setTotalHours] = useState(0);
 const [weeklyWorkouts, setWeeklyWorkouts] = useState(0);
 const [weeklyGoal] = useState(4); // Meta de 4 treinos por semana
 const [painReduction, setPainReduction] = useState(0);

 const loadUserData = useCallback(async () => {
  try {
   setLoading(true);
   
   // Carregar perfil do usuário
   const userProfile = await authService.getCurrentUserProfile();
   setUser(userProfile);
   
   // Carregar dados de treinos
   const treinos = await treinoService.listarTreinos();
   const treinosCompletos = treinos.filter(t => t.status === 'completed');
   
   setTotalWorkouts(treinosCompletos.length);
   setTotalHours(treinosCompletos.length * 0.5); // 30min por treino
   
   // Calcular treinos desta semana
   const hoje = new Date();
   const inicioSemana = new Date(hoje);
   inicioSemana.setDate(hoje.getDate() - hoje.getDay()); // Domingo
   
   const treinosEstaSemana = treinosCompletos.filter(t => {
    const dataExecutacao = new Date(t.data_execucao || t.data_criacao);
    return dataExecutacao >= inicioSemana;
   });
   setWeeklyWorkouts(treinosEstaSemana.length);
   
   // Obter streak dos treinos usando o streakService
   try {
    const workoutStreak = await streakService.getStreakByType('workout');
    if (workoutStreak) {
     setStreakDays(workoutStreak.streak_atual);
    } else {
     // Se não existe streak, inicializar e deixar em 0
     await streakService.initializeStreak('workout');
     setStreakDays(0);
    }
   } catch (error) {
    console.log('Erro ao obter streak:', error);
    setStreakDays(0);
   }
   
   // Calcular redução da dor (simulação baseada nos treinos)
   try {
    const dorData = await dorService.listarHistoricoDor();
    if (dorData.length >= 2) {
     const primeiroRegistro = dorData[dorData.length - 1];
     const ultimoRegistro = dorData[0];
     const reducao = ((primeiroRegistro.nivel_dor - ultimoRegistro.nivel_dor) / primeiroRegistro.nivel_dor) * 100;
     setPainReduction(Math.max(0, Math.min(100, reducao)));
    } else {
     // Simulação baseada nos treinos completados
     const reducaoSimulada = Math.min(treinosCompletos.length * 2, 100);
     setPainReduction(reducaoSimulada);
    }
   } catch (error) {
    console.log('Nenhum dado de dor para calcular redução');
    setPainReduction(0);
   }
   
  } catch (error) {
   console.error('Erro ao carregar dados do perfil:', error);
   Alert.alert('Erro', 'Não foi possível carregar os dados do perfil');
  } finally {
   setLoading(false);
  }
 }, []);

 useEffect(() => {
  loadUserData();
 }, [loadUserData]);

 const handleGoBack = useCallback(() => {
  Haptics.selectionAsync();
  navigation.goBack();
 }, [navigation]);

 const handleEditProfile = useCallback(() => {
  Haptics.selectionAsync();
  Alert.alert('Em breve', 'Edição de perfil em desenvolvimento');
 }, []);

 const handleConnectPersonal = useCallback(() => {
  Haptics.selectionAsync();
  console.log('Navigating to ConnectPersonal...');
  navigation.navigate('ConnectPersonal');
 }, [navigation]);

 const handleLogout = useCallback(async () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  Alert.alert(
   'Sair da conta',
   'Tem certeza que deseja sair da sua conta?',
   [
    { text: 'Cancelar', style: 'cancel' },
    {
     text: 'Sair',
     style: 'destructive',
     onPress: async () => {
      try {
       await authService.signOut();
       navigation.replace('Auth');
      } catch (error) {
       Alert.alert('Erro', 'Não foi possível sair da conta');
      }
     },
    },
   ]
  );
 }, [navigation]);

 const userType = useMemo(() => {
  if (!user?.tipo) return 'Usuário';
  switch (user.tipo) {
   case 'aluno': return 'Aluno';
   case 'personal_trainer': return 'Personal Trainer';
   default: return 'Usuário';
  }
 }, [user?.tipo]);

 const formatTime = (hours: number) => {
  const h = Math.floor(hours);
  const min = Math.round((hours - h) * 60);
  return `${h}h ${min}min`;
 };

 if (loading) {
  return (
   <LinearGradient
    colors={[colors.background.primary, colors.background.secondary]}
    style={{ flex: 1 }}
   >
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 }}>
     <Text style={typography.presets.body}>Carregando perfil...</Text>
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
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 }}>
     <Text style={typography.presets.body}>Perfil não encontrado</Text>
    </View>
   </LinearGradient>
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
      <Icon name="arrow-back" size={24} color={colors.text.primary} />
     </TouchableOpacity>
     
     <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
      <Icon name="user" size={24} color={colors.text.primary} />
      <Text style={typography.presets.screenTitle}>
       Perfil
      </Text>
     </View>
     
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
     {/* Header com gradiente sutil */}
     <LinearGradient
      colors={['rgba(228, 255, 26, 0.08)', 'transparent']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
       borderRadius: borderRadius.xl,
       padding: spacing.lg,
       marginBottom: spacing.lg,
       alignItems: 'center',
      }}
     >

      {/* Avatar Grande com borda gradiente */}
      <View style={{ marginTop: spacing.lg, marginBottom: spacing.md }}>
       <Avatar
        name={user.nome || 'Usuário'}
        size="lg" // 80px com borda
        showBorder={true}
       />
       <TouchableOpacity
        style={{
         position: 'absolute',
         bottom: 0,
         right: 0,
         width: 32,
         height: 32,
         backgroundColor: colors.background.elevated,
         borderRadius: 16,
         alignItems: 'center',
         justifyContent: 'center',
         borderWidth: 2,
         borderColor: colors.accent.primary,
        }}
        onPress={handleEditProfile}
       >
        <Icon name="camera" size={16} color={colors.accent.primary} />
       </TouchableOpacity>
      </View>

      {/* Nome e tipo */}
      <Text style={[
       typography.presets.screenTitle,
       { marginBottom: spacing.xs, textAlign: 'center' }
      ]}>
       {user.nome || 'Usuário'}
      </Text>
      <Text style={[
       typography.presets.body,
       { 
        color: colors.accent.primary,
        fontWeight: '600',
        textAlign: 'center'
       }
      ]}>
       {userType}
      </Text>
     </LinearGradient>

     {/* Informações */}
     <View style={{ marginBottom: spacing.lg }}>
      <Text style={[
       typography.presets.sectionTitle,
       { marginBottom: spacing.md }
      ]}>
       Informações
      </Text>
      
      <Card variant="glass" padding="lg">
       <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.surface.border,
       }}>
        <Text style={[typography.presets.body, { color: colors.text.secondary }]}>
         Email
        </Text>
        <Text style={[typography.presets.body, { fontWeight: '600' }]}>
         {user.email || 'Não informado'}
        </Text>
       </View>
       
       <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.surface.border,
       }}>
        <Text style={[typography.presets.body, { color: colors.text.secondary }]}>
         Nome
        </Text>
        <Text style={[typography.presets.body, { fontWeight: '600' }]}>
         {user.nome || 'Não informado'}
        </Text>
       </View>
       
       <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
       }}>
        <Text style={[typography.presets.body, { color: colors.text.secondary }]}>
         Tipo
        </Text>
        <Text style={[typography.presets.body, { fontWeight: '600' }]}>
         {userType}
        </Text>
       </View>
      </Card>
     </View>

     {/* Progresso Atual */}
     <View style={{ marginBottom: spacing.lg }}>
      <Text style={[
       typography.presets.sectionTitle,
       { marginBottom: spacing.md }
      ]}>
       Progresso Atual
      </Text>
      
      <Card variant="glass" padding="lg">
       <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
       }}>
        <View style={{
         flexDirection: 'row',
         alignItems: 'center',
         gap: spacing.sm,
        }}>
         <Icon name="fire" size={20} color={colors.accent.tertiary} />
         <Text style={typography.presets.body}>Sequência</Text>
        </View>
        <Text style={[typography.presets.body, { 
         fontWeight: '700', 
         color: colors.accent.tertiary 
        }]}>
         {streakDays} dias
        </Text>
       </View>
       
       <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
       }}>
        <View style={{
         flexDirection: 'row',
         alignItems: 'center',
         gap: spacing.sm,
        }}>
         <Icon name="workout" size={20} color={colors.accent.secondary} />
         <Text style={typography.presets.body}>Treinos</Text>
        </View>
        <Text style={[typography.presets.body, { 
         fontWeight: '700', 
         color: colors.accent.secondary 
        }]}>
         {totalWorkouts}
        </Text>
       </View>
       
       <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
       }}>
        <View style={{
         flexDirection: 'row',
         alignItems: 'center',
         gap: spacing.sm,
        }}>
         <Icon name="timer" size={20} color={colors.semantic.info} />
         <Text style={typography.presets.body}>Tempo total</Text>
        </View>
        <Text style={[typography.presets.body, { 
         fontWeight: '700', 
         color: colors.semantic.info 
        }]}>
         {formatTime(totalHours)}
        </Text>
       </View>
       
       <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
       }}>
        <View style={{
         flexDirection: 'row',
         alignItems: 'center',
         gap: spacing.sm,
        }}>
         <Icon name="chart" size={20} color={colors.accent.primary} />
         <Text style={typography.presets.body}>Esta semana</Text>
        </View>
        <Text style={[typography.presets.body, { 
         fontWeight: '700', 
         color: colors.accent.primary 
        }]}>
         {weeklyWorkouts}/{weeklyGoal}
        </Text>
       </View>
      </Card>
     </View>

     {/* Metas */}
     <View style={{ marginBottom: spacing.lg }}>
      <Text style={[
       typography.presets.sectionTitle,
       { marginBottom: spacing.md }
      ]}>
       Metas
      </Text>
      
      <Card variant="glass" padding="lg">
       <ProgressBar
        label="Treinos semanais"
        current={weeklyWorkouts}
        total={weeklyGoal}
        accentColor={colors.accent.secondary}
        showFraction={true}
       />
       
       <ProgressBar
        label="Reduzir dor"
        current={painReduction}
        total={100}
        accentColor={colors.semantic.error}
        showPercentage={true}
       />
      </Card>
     </View>

     {/* Botões de ação */}
     <View style={{ gap: spacing.md, marginBottom: spacing.xl }}>
      {/* Botão conectar personal - apenas para alunos */}
      {user?.tipo === 'aluno' && (
       <Button
        title="Conectar com Personal"
        icon={<Icon name="handshake" size={16} color={colors.background.primary} />}
        onPress={handleConnectPersonal}
        variant="primary"
        size="lg"
       />
      )}
      
      <Button
       title="Editar Perfil"
       onPress={handleEditProfile}
       variant="secondary"
       size="lg"
      />
      
      <Button
       title="Sair →"
       onPress={handleLogout}
       variant="ghost"
       size="lg"
       style={{
        borderColor: colors.semantic.error,
       }}
      />
     </View>
    </ScrollView>
   </LinearGradient>
  </ScreenWrapper>
 );
});