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
import { programaService } from '../services/programaService';
import { authService } from '../services/authService';
import { Programa } from '../types';

interface ProgramLibraryScreenProps {
 navigation: any;
}

export const ProgramLibraryScreen = memo<ProgramLibraryScreenProps>(({ navigation }) => {
 const [programs, setPrograms] = useState<Programa[]>([]);
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [searchText, setSearchText] = useState('');
 const [filter, setFilter] = useState<string>('todos');
 const [user, setUser] = useState<any>(null);

 const FILTERS = [
  { id: 'todos', label: 'Todos', icon: '📋' },
  { id: 'Hipertrofia', label: 'Hipertrofia', icon: '💪' },
  { id: 'Emagrecimento', label: 'Emagrecimento', icon: '🔥' },
  { id: 'Força', label: 'Força', icon: '🏋️' },
  { id: 'Condicionamento', label: 'Condicionamento', icon: '🏃' },
  { id: 'Reabilitação', label: 'Reabilitação', icon: '🏥' },
  { id: 'Flexibilidade', label: 'Flexibilidade', icon: '🧘' },
 ];

 const loadPrograms = useCallback(async () => {
  try {
   setLoading(true);
   
   const userProfile = await authService.getCurrentUserProfile();
   setUser(userProfile);
   
   const filtros: any = {
    search: searchText || undefined,
   };
   
   if (filter !== 'todos') {
    filtros.categoria = filter;
   }
   
   const response = await programaService.buscarProgramas(filtros, 1, 50);
   
   if (!response || !response.data) {
    console.error('Erro ao carregar programas: resposta inválida');
    Alert.alert('Erro', 'Não foi possível carregar os programas');
    return;
   }
   
   setPrograms(response.data);
  } catch (error: any) {
   console.error('Erro ao carregar programas:', error);
   Alert.alert('Erro', error.message || 'Erro desconhecido');
  } finally {
   setLoading(false);
  }
 }, [searchText, filter]);

 const handleRefresh = useCallback(async () => {
  setRefreshing(true);
  await loadPrograms();
  setRefreshing(false);
 }, [loadPrograms]);

 useEffect(() => {
  loadPrograms();
 }, [loadPrograms, filter]);

 const handleGoBack = useCallback(() => {
  Haptics.selectionAsync();
  navigation.goBack();
 }, [navigation]);

 const handleCreateProgram = useCallback(() => {
  Haptics.selectionAsync();
  navigation.navigate('CreateProgram');
 }, [navigation]);

 const handleProgramPress = useCallback((program: Programa) => {
  Haptics.selectionAsync();
  navigation.navigate('ProgramExecution', { template: program });
 }, [navigation]);

 const getLevelColor = (nivel: string) => {
  switch (nivel) {
   case 'iniciante': return colors.accent.secondary;
   case 'intermediario': return colors.semantic.warning;
   case 'avancado': return colors.semantic.error;
   default: return colors.accent.primary;
  }
 };

 const getCategoryData = (categoria: string) => {
  return FILTERS.find(cat => cat.id === categoria) || {
   id: categoria,
   label: categoria,
   icon: '📋',
   color: colors.text.secondary
  };
 };

 // Filtrar programas
 const filteredPrograms = programs.filter(program => {
  const matchesSearch = program.nome.toLowerCase().includes(searchText.toLowerCase()) ||
                       (program.descricao?.toLowerCase().includes(searchText.toLowerCase()));
  
  if (!matchesSearch) return false;
  
  if (filter === 'todos') return true;
  
  return program.categoria === filter;
 });

 const stats = {
  total: programs.length,
  hipertrofia: programs.filter(p => p.categoria === 'Hipertrofia').length,
  emagrecimento: programs.filter(p => p.categoria === 'Emagrecimento').length,
  forca: programs.filter(p => p.categoria === 'Força').length,
 };

 const renderProgramItem = ({ item }: { item: Programa }) => {
  const categoryData = getCategoryData(item.categoria);
  
  return (
   <TouchableOpacity
    onPress={() => handleProgramPress(item)}
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
       
       <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xs,
       }}>
        <Text style={{ fontSize: 16 }}>
         {categoryData.icon}
        </Text>
        <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
         {categoryData.label}
        </Text>
       </View>
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
        {item.nivel?.toUpperCase() || 'INICIANTE'}
       </Text>
      </View>
     </View>

     {item.descricao && (
      <View style={{
       backgroundColor: colors.surface.card,
       borderRadius: borderRadius.sm,
       padding: spacing.sm,
       marginBottom: spacing.sm,
      }}>
       <Text style={[typography.presets.body, { lineHeight: 18 }]} numberOfLines={2}>
        {item.descricao}
       </Text>
      </View>
     )}

     <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
     }}>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
       <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Icon name="calendar" size={14} color={colors.text.tertiary} />
        <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
         {item.duracao_semanas || 4} sem
        </Text>
       </View>
       
       <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Icon name="repeat" size={14} color={colors.text.tertiary} />
        <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
         {item.frequencia_semanal || 3}x/sem
        </Text>
       </View>
      </View>
      
      <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
       Biblioteca pública
      </Text>
     </View>
    </Card>
   </TouchableOpacity>
  );
 };

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
     placeholder="Buscar programas..."
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
    gap: spacing.sm,
    marginBottom: spacing.lg,
   }}>
    <MetricCard
     value={stats.total}
     label="Total"
     icon={<Icon name="clipboard" size={16} color={colors.accent.primary} />}
     accentColor={colors.accent.primary}
     size="sm"
     style={{ flex: 1 }}
    />
    <MetricCard
     value={stats.hipertrofia}
     label="Hipertrofia"
     icon={<Text style={{ fontSize: 14 }}>💪</Text>}
     accentColor={colors.accent.secondary}
     size="sm"
     style={{ flex: 1 }}
    />
    <MetricCard
     value={stats.emagrecimento}
     label="Emagrecimento"
     icon={<Text style={{ fontSize: 14 }}>🔥</Text>}
     accentColor={colors.semantic.error}
     size="sm"
     style={{ flex: 1 }}
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
     Filtrar por categoria
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
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
       }}>
        <Text style={{ fontSize: 16 }}>
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

   {filteredPrograms.length === 0 && !loading && (
    <Card variant="glass" padding="lg" style={{ marginBottom: spacing.lg }}>
     <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>📋</Text>
      <Text style={[typography.presets.cardTitle, { textAlign: 'center', marginBottom: spacing.xs }]}>
       Nenhum programa encontrado
      </Text>
      <Text style={[typography.presets.body, { textAlign: 'center', marginBottom: spacing.md }]}>
       {searchText 
        ? 'Tente buscar por outro termo ou filtro'
        : 'Navegue pelos filtros para encontrar programas'
       }
      </Text>
      <Button
       title="Criar Programa"
       onPress={handleCreateProgram}
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
      Programas
     </Text>
     
     <Button
      title="Criar"
      onPress={handleCreateProgram}
      variant="gradient"
      size="sm"
      icon={<Text style={{ fontSize: 14 }}>➕</Text>}
     />
    </View>

    <FlatList
     data={filteredPrograms}
     keyExtractor={(item) => item.id}
     renderItem={renderProgramItem}
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

export default ProgramLibraryScreen;