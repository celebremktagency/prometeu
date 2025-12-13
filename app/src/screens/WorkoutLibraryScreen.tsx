import React, { memo, useState, useEffect, useCallback } from 'react';
import { 
 View, 
 Text, 
 FlatList, 
 TouchableOpacity, 
 Alert,
 RefreshControl,
 TextInput 
} from 'react-native';
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
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';
import { professionalService } from '../services/professionalService';

interface WorkoutLibraryScreenProps {
 navigation: any;
 route?: {
  params?: {
   assignToClient?: boolean;
   clientId?: string;
   clientName?: string;
  };
 };
}

interface WorkoutTemplate {
 id: string;
 exercicio: string;
 descricao?: string;
 series: number;
 repeticoes: string | number;
 nivel: 'iniciante' | 'intermediario' | 'avancado';
 categoria: string;
 duracao_min: number;
 publico: boolean;
 criado_por?: string;
 usuario_id?: string; // Added to track user ownership
}

export const WorkoutLibraryScreen = memo<WorkoutLibraryScreenProps>(({ navigation, route }) => {
 const [workouts, setWorkouts] = useState<WorkoutTemplate[]>([]);
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [searchText, setSearchText] = useState('');
 const [filter, setFilter] = useState<string>('meus'); // Show "My Workouts" by default
 const [user, setUser] = useState<any>(null);
 const [userType, setUserType] = useState<string>('');
 const [hasPersonalTrainer, setHasPersonalTrainer] = useState(false);
 const [assigningToClient, setAssigningToClient] = useState(false);
 
 const isAssignmentMode = route?.params?.assignToClient;
 const clientId = route?.params?.clientId;
 const clientName = route?.params?.clientName;

 const FILTERS = [
  { id: 'meus', label: 'Meus Treinos', icon: '💪' },
  { id: 'biblioteca', label: 'Biblioteca', icon: '📚' },
  { id: 'iniciante', label: 'Iniciante', icon: '🟢' },
  { id: 'intermediario', label: 'Intermediário', icon: '🟡' },
  { id: 'avancado', label: 'Avançado', icon: '🔴' },
 ];

 const loadWorkouts = useCallback(async () => {
  try {
   setLoading(true);
   
   const userProfile = await authService.getCurrentUserProfile();
   setUser(userProfile);
   setUserType(userProfile?.tipo || '');
   
   // Check if user has a personal trainer
   if (userProfile?.tipo === 'aluno') {
    const { data: trainerData } = await supabase
     .from('professional_clients')
     .select('professional_id')
     .eq('client_id', userProfile?.user_id || userProfile?.id)
     .eq('status', 'ativo')
     .limit(1);
    
    setHasPersonalTrainer(trainerData && trainerData.length > 0);
   }
   
   // Load workouts based on filter
   let query = supabase.from('treinos').select('*');
   
   if (userProfile) {
    if (isAssignmentMode) {
     // When in assignment mode, always show public library workouts
     query = query.eq('publico', true);
    } else if (filter === 'meus') {
     // Show only user's workouts (private copies they added)
     query = query.eq('usuario_id', userProfile?.user_id || userProfile?.id);
    } else {
     // Show only public workouts from library (including those with null usuario_id)
     query = query.eq('publico', true);
    }
   }
   
   query = query.order('data_criacao', { ascending: false });
   
   const { data, error } = await query;

   if (error) {
    console.error('Erro ao carregar treinos:', error);
    Alert.alert('Erro', 'Não foi possível carregar os treinos');
    return;
   }

   setWorkouts(data || []);
  } catch (error: any) {
   console.error('Erro ao carregar treinos:', error);
   Alert.alert('Erro', error.message || 'Erro desconhecido');
  } finally {
   setLoading(false);
  }
 }, [filter]);

 const handleRefresh = useCallback(async () => {
  setRefreshing(true);
  await loadWorkouts();
  setRefreshing(false);
 }, [loadWorkouts]);

 useEffect(() => {
  loadWorkouts();
 }, [loadWorkouts, filter]);

 const handleGoBack = useCallback(() => {
  Haptics.selectionAsync();
  navigation.goBack();
 }, [navigation]);

 const handleCreateWorkout = useCallback(() => {
  // Check if user has personal trainer and is a student
  if (userType === 'aluno' && hasPersonalTrainer) {
   Alert.alert(
    'Não é possível criar treino',
    'Você possui um personal trainer ativo. Apenas seu personal trainer pode criar e atribuir treinos para você.\n\nPara adicionar treinos à sua lista, navegue pela biblioteca e use treinos existentes.',
    [{ text: 'Entendi', style: 'default' }]
   );
   return;
  }
  
  Haptics.selectionAsync();
  navigation.navigate('CreateWorkout');
 }, [navigation, userType, hasPersonalTrainer]);

 const handleWorkoutPress = useCallback((workout: WorkoutTemplate) => {
  Haptics.selectionAsync();
  navigation.navigate('WorkoutDetail', { workout });
 }, [navigation]);

 const handleUseTemplate = useCallback(async (workout: WorkoutTemplate) => {
  try {
   // If in assignment mode, assign to client
   if (isAssignmentMode && clientId) {
    setAssigningToClient(true);
    await professionalService.atribuirTreino(clientId, workout.id);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
     'Treino Atribuído! ✅', 
     `O treino "${workout.exercicio}" foi atribuído com sucesso para ${clientName}.`,
     [
      {
       text: 'OK',
       onPress: () => {
        navigation.goBack();
       }
      }
     ]
    );
    return;
   }

   // Check if user has personal trainer and is a student
   if (userType === 'aluno' && hasPersonalTrainer) {
    Alert.alert(
     'Não é possível adicionar treino',
     'Você possui um personal trainer ativo. Apenas seu personal trainer pode atribuir treinos para você.\n\nConsulte seu personal trainer para que ele adicione este treino à sua lista.',
     [{ text: 'Entendi', style: 'default' }]
    );
    return;
   }

   const { data: { user } } = await supabase.auth.getUser();
   if (!user) throw new Error('Usuário não autenticado');

   // Create a copy of the template as "MEU TREINO"
   const { error } = await supabase
    .from('treinos')
    .insert({
     usuario_id: user.id,
     exercicio: workout.exercicio,
     descricao: workout.descricao,
     series: workout.series,
     repeticoes: typeof workout.repeticoes === 'number' ? workout.repeticoes.toString() : workout.repeticoes,
     nivel: workout.nivel,
     categoria: workout.categoria,
     duracao_min: workout.duracao_min,
     status: 'planned',
     publico: false,
    });

   if (error) throw error;

   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
   
   // Switch to "Meus Treinos" automatically to show the added workout
   setFilter('meus');
   
   Alert.alert('Sucesso! 💪', 'Treino adicionado aos seus treinos! Visualizando agora na aba "Meus Treinos".');
  } catch (error: any) {
   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
   Alert.alert('Erro', error.message || 'Não foi possível adicionar o treino');
  } finally {
   setAssigningToClient(false);
  }
 }, [userType, hasPersonalTrainer, filter, loadWorkouts, isAssignmentMode, clientId, clientName, navigation]);

 // Filtrar workouts
 const filteredWorkouts = workouts.filter(workout => {
  const matchesSearch = workout.exercicio.toLowerCase().includes(searchText.toLowerCase()) ||
             (workout.descricao?.toLowerCase().includes(searchText.toLowerCase()));
  
  if (!matchesSearch) return false;
  
  switch (filter) {
   case 'iniciante':
   case 'intermediario':
   case 'avancado':
    return workout.nivel === filter;
   case 'meus':
    return true; // All workouts already filtered by query
   case 'biblioteca':
    return true; // All workouts already filtered by query
   default:
    return true; // All workouts already filtered by query
  }
 });

 const stats = {
  total: workouts.length,
  iniciante: workouts.filter(w => w.nivel === 'iniciante').length,
  intermediario: workouts.filter(w => w.nivel === 'intermediario').length,
  avancado: workouts.filter(w => w.nivel === 'avancado').length,
  meus: workouts.filter(w => w.usuario_id === (user?.id || (user as any)?.user_id)).length,
 };

 const getLevelColor = (nivel: string) => {
  switch (nivel) {
   case 'iniciante': return colors.accent.secondary;
   case 'intermediario': return colors.semantic.warning;
   case 'avancado': return colors.semantic.error;
   default: return colors.accent.primary;
  }
 };

 const renderWorkoutItem = ({ item }: { item: WorkoutTemplate }) => (
  <TouchableOpacity
   onPress={() => handleWorkoutPress(item)}
   activeOpacity={0.8}
  >
   <Card variant="elevated" padding="md" style={{ marginBottom: spacing.sm }}>
    <View style={{
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'flex-start',
     marginBottom: spacing.sm,
    }}>
     <View style={{ flex: 1 }}>
      <Text style={[typography.presets.cardTitle, { marginBottom: spacing.xxs }]}>
       {item.exercicio}
      </Text>
      {item.descricao && (
       <Text style={[
        typography.presets.body, 
        { color: colors.text.secondary, marginBottom: spacing.xs }
       ]} numberOfLines={2}>
        {item.descricao}
       </Text>
      )}
     </View>
     
     <View style={{
      backgroundColor: getLevelColor(item.nivel),
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      marginLeft: spacing.sm,
     }}>
      <Text style={[
       typography.presets.caption,
       { color: colors.text.inverse, fontWeight: '600' }
      ]}>
       {item.nivel.toUpperCase()}
      </Text>
     </View>
    </View>

    <View style={{
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: spacing.sm,
    }}>
     <View style={{ flexDirection: 'row', gap: spacing.lg }}>
      <View style={{ alignItems: 'center' }}>
       <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
        Séries
       </Text>
       <Text style={[typography.presets.body, { fontWeight: '600' }]}>
        {item.series}
       </Text>
      </View>
      
      <View style={{ alignItems: 'center' }}>
       <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
        Reps
       </Text>
       <Text style={[typography.presets.body, { fontWeight: '600' }]}>
        {item.repeticoes}
       </Text>
      </View>
      
      <View style={{ alignItems: 'center' }}>
       <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
        Tempo
       </Text>
       <Text style={[typography.presets.body, { fontWeight: '600' }]}>
        {item.duracao_min}min
       </Text>
      </View>
     </View>

     <TouchableOpacity
      onPress={() => handleUseTemplate(item)}
      disabled={assigningToClient}
      style={{
       backgroundColor: assigningToClient ? colors.text.tertiary : colors.accent.primary,
       paddingHorizontal: spacing.md,
       paddingVertical: spacing.sm,
       borderRadius: borderRadius.md,
       opacity: assigningToClient ? 0.7 : 1,
      }}
     >
      <Text style={[
       typography.presets.caption,
       { color: colors.text.inverse, fontWeight: '600' }
      ]}>
       {assigningToClient ? 'ATRIBUINDO...' : (isAssignmentMode ? 'ATRIBUIR' : 'USAR')}
      </Text>
     </TouchableOpacity>
    </View>

    <View style={{
     flexDirection: 'row',
     alignItems: 'center',
     gap: spacing.sm,
    }}>
     <Text style={typography.presets.caption}>
      📂 {item.categoria}
     </Text>
     <View style={{
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.text.tertiary,
     }} />
     <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
      {item.usuario_id === (user?.id || (user as any)?.user_id) ? 
       'Criado por você' : 
       'Biblioteca pública'
      }
     </Text>
    </View>
   </Card>
  </TouchableOpacity>
 );

 const renderHeader = () => (
  <>
   {/* Busca */}
   <View style={{
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
   }}>
    <TextInput
     placeholder={
      filter === 'meus' ? "Buscar nos meus treinos..." :
      filter === 'biblioteca' ? "Buscar na biblioteca..." :
      "Buscar exercícios..."
     }
     placeholderTextColor={colors.text.tertiary}
     value={searchText}
     onChangeText={setSearchText}
     style={{
      fontSize: typography.sizes.md,
      color: colors.text.primary,
      padding: 0,
     }}
    />
   </View>

   {/* Estatísticas */}
   <View style={{
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
   }}>
    <MetricCard
     value={stats.total}
     label="Total"
     icon={<Icon name="library" size={16} color={colors.accent.secondary} />}
     accentColor={colors.accent.primary}
     size="sm"
     style={{ flex: 1, minWidth: '48%' }}
    />
    <MetricCard
     value={stats.meus}
     label="Meus"
     icon={<Icon name="user" size={16} color={colors.text.primary} />}
     accentColor={colors.accent.secondary}
     size="sm"
     style={{ flex: 1, minWidth: '48%' }}
    />
   </View>

   {/* Filtros */}
   <View style={{ marginBottom: spacing.lg }}>
    <Text style={[
     typography.presets.body,
     { 
      color: colors.text.secondary,
      marginBottom: spacing.sm 
     }
    ]}>
     Filtrar por nível
    </Text>
    
    <View style={{
     flexDirection: 'row',
     flexWrap: 'wrap',
     gap: spacing.sm,
    }}>
     {FILTERS.map((filterItem) => (
      <TouchableOpacity
       key={filterItem.id}
       onPress={() => {
        Haptics.selectionAsync();
        setFilter(filterItem.id);
       }}
       activeOpacity={0.8}
      >
       <View style={{
        backgroundColor: filter === filterItem.id 
         ? colors.background.elevated 
         : colors.background.secondary,
        borderWidth: 2,
        borderColor: filter === filterItem.id 
         ? colors.accent.primary 
         : colors.surface.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
       }}>
        <Text style={{ fontSize: 14 }}>
         {filterItem.icon}
        </Text>
        <Text style={{
         fontSize: typography.sizes.sm,
         fontWeight: '600',
         color: filter === filterItem.id 
          ? colors.accent.primary 
          : colors.text.primary,
        }}>
         {filterItem.label}
        </Text>
       </View>
      </TouchableOpacity>
     ))}
    </View>
   </View>

   {filteredWorkouts.length === 0 && !loading && (
    <Card variant="glass" padding="lg" style={{ marginBottom: spacing.lg }}>
     <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>
       {filter === 'meus' ? '💪' : '📚'}
      </Text>
      <Text style={[typography.presets.cardTitle, { textAlign: 'center', marginBottom: spacing.xs }]}>
       {filter === 'meus' 
        ? 'Nenhum treino ainda' 
        : searchText 
         ? 'Nenhum exercício encontrado' 
         : 'Biblioteca vazia'
       }
      </Text>
      <Text style={[typography.presets.body, { textAlign: 'center', marginBottom: spacing.md }]}>
       {filter === 'meus'
        ? (userType === 'aluno' && hasPersonalTrainer
           ? 'Seu personal trainer ainda não atribuiu treinos para você. Navegue pela biblioteca para ver exercícios disponíveis.'
           : 'Crie seus próprios exercícios ou adicione da biblioteca')
        : searchText
         ? 'Tente buscar por outro termo ou filtro'
         : 'Navegue pelos filtros para encontrar exercícios'
       }
      </Text>
      {(filter === 'meus' && !(userType === 'aluno' && hasPersonalTrainer)) && (
       <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button
         title="Criar Exercício"
         onPress={handleCreateWorkout}
         variant="secondary"
         size="sm"
        />
        <Button
         title="Ver Biblioteca"
         onPress={() => {
          setFilter('biblioteca');
          Haptics.selectionAsync();
         }}
         variant="ghost"
         size="sm"
        />
       </View>
      )}
      {(filter === 'meus' && userType === 'aluno' && hasPersonalTrainer) && (
       <Button
        title="Ver Biblioteca"
        onPress={() => {
         setFilter('biblioteca');
         Haptics.selectionAsync();
        }}
        variant="secondary"
        size="sm"
       />
      )}
     </View>
    </Card>
   )}
  </>
 );

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
     <TouchableOpacity onPress={handleGoBack}>
      <Text style={{ fontSize: 24, color: colors.text.primary }}>←</Text>
     </TouchableOpacity>
     
     <Text style={typography.presets.screenTitle}>
       {isAssignmentMode 
        ? `Atribuir para ${clientName}`
        : (filter === 'meus' ? 'Meus Treinos' : filter === 'biblioteca' ? 'Biblioteca' : 'Exercícios')
       }
     </Text>
     
     {/* Show create button only if user can create workouts and not in assignment mode */}
     {!isAssignmentMode && !(userType === 'aluno' && hasPersonalTrainer) && (
      <Button
       title="Criar"
       onPress={handleCreateWorkout}
       variant="gradient"
       size="sm"
       icon={<Text style={{ fontSize: 14 }}>➕</Text>}
      />
     )}
     {(isAssignmentMode || (userType === 'aluno' && hasPersonalTrainer)) && (
      <View style={{ width: 60 }} />
     )}
    </View>

    <FlatList
     data={filteredWorkouts}
     keyExtractor={(item) => item.id}
     renderItem={renderWorkoutItem}
     ListHeaderComponent={renderHeader}
     contentContainerStyle={{
      paddingHorizontal: spacing.screenHorizontal,
      paddingBottom: spacing.screenVertical,
     }}
     showsVerticalScrollIndicator={false}
     refreshControl={
      <RefreshControl
       refreshing={refreshing}
       onRefresh={handleRefresh}
       tintColor={colors.accent.primary}
       colors={[colors.accent.primary]}
      />
     }
    />
   </LinearGradient>
  </ScreenWrapper>
 );
});