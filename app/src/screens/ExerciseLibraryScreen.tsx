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
import { exercicioService } from '../services/exercicioService';
import { authService } from '../services/authService';
import { Exercicio } from '../types';

interface ExerciseLibraryScreenProps {
 navigation: any;
}

export const ExerciseLibraryScreen = memo<ExerciseLibraryScreenProps>(({ navigation }) => {
 const [exercises, setExercises] = useState<Exercicio[]>([]);
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [searchText, setSearchText] = useState('');
 const [filter, setFilter] = useState<string>('todos');
 const [user, setUser] = useState<any>(null);

 const FILTERS = [
  { id: 'todos', label: 'Todos', icon: '📋' },
  { id: 'peito', label: 'Peito', icon: '💪' },
  { id: 'costas', label: 'Costas', icon: '🏋️' },
  { id: 'pernas', label: 'Pernas', icon: '🦵' },
  { id: 'ombros', label: 'Ombros', icon: '💪' },
  { id: 'braços', label: 'Braços', icon: '💪' },
  { id: 'abdomen', label: 'Abdome', icon: '🟡' },
 ];

 const loadExercises = useCallback(async () => {
  try {
   setLoading(true);
   
   const userProfile = await authService.getCurrentUserProfile();
   setUser(userProfile);
   
   const filtros: any = {
    search: searchText || undefined,
   };
   
   if (filter !== 'todos') {
    filtros.grupo_muscular = [filter];
   }
   
   const response = await exercicioService.buscarExercicios(filtros, 1, 100);
   
   if (!response || !response.data) {
    console.error('Erro ao carregar exercícios: resposta inválida');
    Alert.alert('Erro', 'Não foi possível carregar os exercícios');
    return;
   }
   
   setExercises(response.data);
  } catch (error: any) {
   console.error('Erro ao carregar exercícios:', error);
   Alert.alert('Erro', error.message || 'Erro desconhecido');
  } finally {
   setLoading(false);
  }
 }, [searchText, filter]);

 const handleRefresh = useCallback(async () => {
  setRefreshing(true);
  await loadExercises();
  setRefreshing(false);
 }, [loadExercises]);

 useEffect(() => {
  loadExercises();
 }, [loadExercises, filter]);

 const handleGoBack = useCallback(() => {
  Haptics.selectionAsync();
  navigation.goBack();
 }, [navigation]);

 const handleCreateExercise = useCallback(() => {
  Haptics.selectionAsync();
  navigation.navigate('CreateExercise');
 }, [navigation]);

 const handleExercisePress = useCallback((exercise: Exercicio) => {
  Haptics.selectionAsync();
  navigation.navigate('ExerciseDetail', { exercise });
 }, [navigation]);

 const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
   case 'iniciante': return colors.accent.secondary;
   case 'intermediario': return colors.semantic.warning;
   case 'avancado': return colors.semantic.error;
   default: return colors.accent.primary;
  }
 };

 // Filtrar exercícios
 const filteredExercises = exercises.filter(exercise => {
  const matchesSearch = exercise.nome.toLowerCase().includes(searchText.toLowerCase()) ||
                       (exercise.descricao?.toLowerCase().includes(searchText.toLowerCase()));
  
  if (!matchesSearch) return false;
  
  if (filter === 'todos') return true;
  
  return exercise.grupo_muscular?.includes(filter);
 });

 const stats = {
  total: exercises.length,
  iniciante: exercises.filter(e => e.dificuldade === 'iniciante').length,
  intermediario: exercises.filter(e => e.dificuldade === 'intermediario').length,
  avancado: exercises.filter(e => e.dificuldade === 'avancado').length,
 };

 const renderExerciseItem = ({ item }: { item: Exercicio }) => (
  <TouchableOpacity
   onPress={() => handleExercisePress(item)}
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
       {item.nome}
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
      backgroundColor: getDifficultyColor(item.dificuldade),
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      marginLeft: spacing.sm,
     }}>
      <Text style={[
       typography.presets.caption,
       { color: colors.text.inverse, fontWeight: '600' }
      ]}>
       {item.dificuldade?.toUpperCase() || 'N/A'}
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
        Nível
       </Text>
       <Text style={[typography.presets.body, { fontWeight: '600' }]}>
        {item.dificuldade || 'N/A'}
       </Text>
      </View>
      
      <View style={{ alignItems: 'center' }}>
       <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
        Equipamento
       </Text>
       <Text style={[typography.presets.body, { fontWeight: '600' }]}>
        {item.equipamento || 'Peso corporal'}
       </Text>
      </View>
     </View>
    </View>

    <View style={{
     flexDirection: 'row',
     alignItems: 'center',
     gap: spacing.sm,
    }}>
     {item.grupo_muscular && item.grupo_muscular.length > 0 && (
      <>
       <Text style={typography.presets.caption}>
        🎯 {item.grupo_muscular.slice(0, 2).join(', ')}
        {item.grupo_muscular.length > 2 && ` +${item.grupo_muscular.length - 2}`}
       </Text>
       <View style={{
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.text.tertiary,
       }} />
      </>
     )}
     <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
      Biblioteca pública
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
     placeholder="Buscar exercícios..."
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
     icon={<Icon name="fitness" size={16} color={colors.accent.primary} />}
     accentColor={colors.accent.primary}
     size="sm"
     style={{ flex: 1, minWidth: '48%' }}
    />
    <MetricCard
     value={stats.iniciante}
     label="Iniciante"
     icon={<Text style={{ fontSize: 10 }}>🟢</Text>}
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
     Filtrar por grupo muscular
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

   {filteredExercises.length === 0 && !loading && (
    <Card variant="glass" padding="lg" style={{ marginBottom: spacing.lg }}>
     <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>💪</Text>
      <Text style={[typography.presets.cardTitle, { textAlign: 'center', marginBottom: spacing.xs }]}>
       Nenhum exercício encontrado
      </Text>
      <Text style={[typography.presets.body, { textAlign: 'center', marginBottom: spacing.md }]}>
       {searchText 
        ? 'Tente buscar por outro termo ou filtro'
        : 'Navegue pelos filtros para encontrar exercícios'
       }
      </Text>
      <Button
       title="Criar Exercício"
       onPress={handleCreateExercise}
       variant="secondary"
       size="sm"
      />
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
      Exercícios
     </Text>
     
     <Button
      title="Criar"
      onPress={handleCreateExercise}
      variant="gradient"
      size="sm"
      icon={<Text style={{ fontSize: 14 }}>➕</Text>}
     />
    </View>

    <FlatList
     data={filteredExercises}
     keyExtractor={(item) => item.id}
     renderItem={renderExerciseItem}
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

export default ExerciseLibraryScreen;