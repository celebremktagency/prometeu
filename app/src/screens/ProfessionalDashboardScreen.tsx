import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, FlatList } from 'react-native';
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
 Avatar,
 MetricCard,
 WeeklyCalendar,
 Icon,
} from '../design-system';
import { authService } from '../services/authService';
import { treinoService } from '../services/treinoService';
import { professionalService } from '../services/professionalService';
import { inviteService } from '../services/inviteService';

interface ProfessionalDashboardScreenProps {
 navigation: any;
}

export const ProfessionalDashboardScreen = memo<ProfessionalDashboardScreenProps>(({ navigation }) => {
 const [user, setUser] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [clients, setClients] = useState<any[]>([]);
 const [workoutTemplates, setWorkoutTemplates] = useState<any[]>([]);
 const [weeklyActivity, setWeeklyActivity] = useState([false, false, false, false, false, false, false]);
 const [metrics, setMetrics] = useState({
  totalClients: 0,
  activeClients: 0,
  workoutTemplates: 0,
  weeklyActiveClients: 0,
 });

 // Função para detectar período do dia
 const getGreeting = useCallback(() => {
  const hour = new Date().getHours();
  if (hour < 6) return 'Boa madrugada';
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
 }, []);

 const greeting = useMemo(() => getGreeting(), [getGreeting]);

 const loadDashboardData = useCallback(async () => {
  try {
   setLoading(true);
   const userProfile = await authService.getCurrentUserProfile();
   setUser(userProfile);

   // Carregar clientes do personal
   try {
    const clientsData = await inviteService.getMyClients(userProfile.id);
    setClients(clientsData);
    
    const activeClients = clientsData.filter(c => c.relationship_status === 'ativo').length;
    setMetrics(prev => ({
     ...prev,
     totalClients: clientsData.length,
     activeClients: activeClients,
    }));
   } catch (error) {
    console.log('Nenhum cliente encontrado:', error);
    setClients([]);
   }

   // Carregar templates de treino
   try {
    const templatesData = await treinoService.listarTreinos();
    setWorkoutTemplates(templatesData);
    setMetrics(prev => ({
     ...prev,
     workoutTemplates: templatesData.length,
    }));
   } catch (error) {
    console.log('Nenhum template encontrado');
   }

   // Simular atividade semanal baseada nos clientes ativos
   const activity = Array(7).fill(false).map((_, index) => {
    // Simula atividade baseada nos clientes (mais realista seria pegar dados reais)
    return Math.random() > 0.4; // 60% chance de atividade
   });
   setWeeklyActivity(activity);

   // Calcular clientes ativos na semana (simulação)
   const weeklyActive = Math.floor(Math.random() * (metrics.activeClients || 1)) + 1;
   setMetrics(prev => ({
    ...prev,
    weeklyActiveClients: weeklyActive,
   }));

  } catch (error) {
   console.error('Erro ao carregar dashboard:', error);
   Alert.alert('Erro', 'Não foi possível carregar os dados do dashboard');
  } finally {
   setLoading(false);
  }
 }, []);

 useEffect(() => {
  loadDashboardData();
 }, [loadDashboardData]);

 const handleProfilePress = useCallback(() => {
  Haptics.selectionAsync();
  navigation.navigate('Profile');
 }, [navigation]);

 const handleNotificationPress = useCallback(() => {
  Haptics.selectionAsync();
  Alert.alert('Em breve', 'Notificações em desenvolvimento');
 }, []);

 const handleLogout = useCallback(async () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  try {
   await authService.signOut();
   navigation.replace('Auth');
  } catch (error) {
   Alert.alert('Erro', 'Não foi possível fazer logout');
  }
 }, [navigation]);

 const handleViewAllClients = useCallback(() => {
  Haptics.selectionAsync();
  navigation.navigate('ClientList');
 }, [navigation]);

 const handleCreateWorkout = useCallback(() => {
  Haptics.selectionAsync();
  navigation.navigate('CreateWorkout');
 }, [navigation]);

 const handleWorkoutLibrary = useCallback(() => {
  Haptics.selectionAsync();
  navigation.navigate('WorkoutLibrary');
 }, [navigation]);

 const handleClientPress = useCallback((client: any) => {
  Haptics.selectionAsync();
  navigation.navigate('ClientDetails', { client });
 }, [navigation]);

 const renderClientItem = ({ item }: { item: any }) => (
  <TouchableOpacity
   onPress={() => handleClientPress(item)}
   activeOpacity={0.8}
  >
   <Card variant="elevated" padding="md" style={{ marginBottom: spacing.sm }}>
    <View style={{
     flexDirection: 'row',
     alignItems: 'center',
     gap: spacing.md,
    }}>
     <Avatar
      name={item.nome || 'Cliente'}
      size="sm"
      showBorder={false}
     />
     
     <View style={{ flex: 1 }}>
      <Text style={[typography.presets.cardTitle, { marginBottom: spacing.xxs }]}>
       {item.nome || 'Cliente sem nome'}
      </Text>
      <Text style={[typography.presets.body, { color: colors.text.secondary }]}>
       {item.relationship_status === 'ativo' ? 'Ativo' : 'Inativo'} • Vinculado em {new Date(item.relationship_started).toLocaleDateString('pt-BR')}
      </Text>
     </View>
     
     <View style={{
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: item.relationship_status === 'ativo' ? colors.accent.secondary : colors.text.tertiary,
     }} />
    </View>
   </Card>
  </TouchableOpacity>
 );

 if (loading) {
  return (
   <LinearGradient
    colors={[colors.background.primary, colors.background.secondary]}
    style={{ flex: 1 }}
   >
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
     <Text style={typography.presets.body}>Carregando dashboard...</Text>
    </SafeAreaView>
   </LinearGradient>
  );
 }

 if (!user) {
  return (
   <LinearGradient
    colors={[colors.background.primary, colors.background.secondary]}
    style={{ flex: 1 }}
   >
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
     <Text style={typography.presets.body}>Usuário não encontrado</Text>
     <Button title="Fazer Login" onPress={handleLogout} variant="gradient" />
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
       name={user.nome || 'Personal'}
       size="md"
       onPress={handleProfilePress}
       showBorder={true}
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
        <Text style={{ fontSize: 20 }}>🔔</Text>
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
        <Icon name="trending-up" size={16} color={colors.accent.secondary} />
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
       {user.nome || 'Personal'}
      </Text>
      <Text style={[
       typography.presets.body,
       { color: colors.accent.primary, fontWeight: '600' }
      ]}>
       Personal Trainer 
      </Text>
     </View>

     {/* Métricas em Grid 2x2 */}
     <View style={{
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
     }}>
      <View style={{
       flex: 1,
       gap: spacing.sm,
      }}>
       <MetricCard
        value={metrics.totalClients}
        label="Total Clientes"
        icon={<Icon name="clients" size={20} color={colors.accent.primary} />}
        accentColor={colors.accent.primary}
        size="md"
       />
       
       <MetricCard
        value={metrics.workoutTemplates}
        label="Templates"
        icon={<Icon name="template" size={16} color={colors.text.primary} />}
        accentColor={colors.semantic.info}
        size="md"
       />
      </View>
      
      <View style={{
       flex: 1,
       gap: spacing.sm,
      }}>
       <MetricCard
        value={metrics.activeClients}
        label="Clientes Ativos"
        icon={<Icon name="check" size={16} color={colors.accent.secondary} />}
        accentColor={colors.accent.secondary}
        size="md"
       />
       
       <MetricCard
        value={metrics.weeklyActiveClients}
        label="Ativos semana"
        icon={<Icon name="chart" size={16} color={colors.accent.primary} />}
        accentColor={colors.accent.tertiary}
        size="md"
       />
      </View>
     </View>

     {/* Atividade Semanal */}
     <WeeklyCalendar
      workoutDays={weeklyActivity}
      animated={true}
     />

     {/* Ações Rápidas */}
     <View style={{ marginBottom: spacing.lg }}>
      <Text style={[
       typography.presets.sectionTitle,
       { marginBottom: spacing.md }
      ]}>
        Ações Rápidas
      </Text>
      
      {/* Primeira linha */}
      <View style={{
       flexDirection: 'row',
       gap: spacing.sm,
       marginBottom: spacing.sm,
      }}>
       <Button
        title="Criar Treino"
        onPress={handleCreateWorkout}
        variant="gradient"
        size="md"
        fullWidth={true}
        style={{ flex: 1 }}
        icon={<Text style={{ fontSize: 16 }}>➕</Text>}
       />
       
       <Button
        title="Biblioteca"
        onPress={handleWorkoutLibrary}
        variant="secondary"
        size="md"
        fullWidth={true}
        style={{ flex: 1 }}
        icon={<Icon name="library" size={16} color={colors.accent.secondary} />}
       />
      </View>

      {/* Segunda linha */}
      <View style={{
       flexDirection: 'row',
       gap: spacing.sm,
       marginBottom: spacing.sm,
      }}>
       <Button
        title="Meus Clientes"
        onPress={handleViewAllClients}
        variant="ghost"
        size="md"
        fullWidth={true}
        style={{ flex: 1 }}
        icon={<Icon name="clients" size={16} color={colors.accent.primary} />}
       />
       
       <Button
        title="Calendário"
        onPress={() => {
         Haptics.selectionAsync();
         navigation.navigate('ProfessionalCalendar');
        }}
        variant="ghost"
        size="md"
        fullWidth={true}
        style={{ flex: 1 }}
        icon={<Icon name="calendar" size={16} color={colors.accent.primary} />}
       />
      </View>

      {/* Terceira linha */}
      <View style={{
       flexDirection: 'row',
       gap: spacing.sm,
      }}>
       <Button
        title="Perfil"
        onPress={handleProfilePress}
        variant="ghost"
        size="md"
        fullWidth={true}
        style={{ flex: 1 }}
        icon={<Icon name="user" size={16} color={colors.text.primary} />}
       />
       
       <Button
        title="Comunidade"
        onPress={() => {
         Haptics.selectionAsync();
         navigation.navigate('Community');
        }}
        variant="ghost"
        size="md"
        fullWidth={true}
        style={{ flex: 1 }}
        icon={<Icon name="favorite" size={16} color={colors.accent.tertiary} />}
       />
      </View>
     </View>

     {/* Lista de Clientes Recentes */}
     <View style={{ marginBottom: spacing.lg }}>
      <View style={{
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       marginBottom: spacing.md,
      }}>
       <Text style={typography.presets.sectionTitle}>
        Clientes Recentes
       </Text>
       
       <TouchableOpacity onPress={handleViewAllClients}>
        <Text style={[
         typography.presets.body,
         { 
          color: colors.accent.primary,
          fontWeight: '600' 
         }
        ]}>
         Ver todos
        </Text>
       </TouchableOpacity>
      </View>

      {clients.length === 0 ? (
       <Card variant="glass" padding="lg">
        <View style={{ alignItems: 'center' }}>
         <Icon name="clients" size={16} color={colors.accent.primary} />
         <Text style={[typography.presets.cardTitle, { textAlign: 'center', marginBottom: spacing.xs }]}>
          Nenhum cliente ainda
         </Text>
         <Text style={[typography.presets.body, { textAlign: 'center', marginBottom: spacing.md }]}>
          Comece a construir sua base de clientes
         </Text>
         <Button
          title="Adicionar Cliente"
          onPress={() => navigation.navigate('MyCode')}
          variant="secondary"
          size="sm"
         />
        </View>
       </Card>
      ) : (
       <View>
        {clients.slice(0, 3).map((client) => (
         <View key={client.id}>
          {renderClientItem({ item: client })}
         </View>
        ))}
       </View>
      )}
     </View>

     {/* Sistema de Convites */}
     <View style={{ marginBottom: spacing.lg }}>
      <Text style={[
       typography.presets.sectionTitle,
       { marginBottom: spacing.md }
      ]}>
        Expandir Rede
      </Text>
      
      <Card variant="glass" padding="lg">
       <View style={{ alignItems: 'center' }}>
        <Icon name="notification" size={16} color={colors.accent.secondary} />
        <Text style={[typography.presets.cardTitle, { textAlign: 'center', marginBottom: spacing.xs }]}>
         Convide Novos Clientes
        </Text>
        <Text style={[typography.presets.body, { textAlign: 'center', marginBottom: spacing.md, color: colors.text.secondary }]}>
         Compartilhe seu código de convite ou envie um link direto para seus clientes
        </Text>
        <View style={{
         flexDirection: 'row',
         gap: spacing.sm,
         width: '100%',
        }}>
         <Button
          title="Ver Convites"
          onPress={() => {
           Haptics.selectionAsync();
           navigation.navigate('InviteManagement');
          }}
          variant="secondary"
          size="sm"
          fullWidth={true}
          style={{ flex: 1 }}
          icon={<Icon name="notification" size={16} color={colors.accent.secondary} />}
         />
         <Button
          title="Meu Código"
          onPress={() => {
           Haptics.selectionAsync();
           navigation.navigate('MyCode');
          }}
          variant="ghost"
          size="sm"
          fullWidth={true}
          style={{ flex: 1 }}
          icon={<Icon name="code" size={16} color={colors.accent.primary} />}
         />
        </View>
       </View>
      </Card>
     </View>

     {/* Espaçamento final */}
     <View style={{ height: spacing.xl }} />
    </ScrollView>
   </SafeAreaView>
  </LinearGradient>
 );
});