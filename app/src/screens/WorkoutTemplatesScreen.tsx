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
import { templateService, WorkoutTemplate } from '../services/templateService';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';

interface WorkoutTemplatesScreenProps {
 navigation: any;
}

export const WorkoutTemplatesScreen = memo<WorkoutTemplatesScreenProps>(({ navigation }) => {
 const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [searchText, setSearchText] = useState('');
 const [filter, setFilter] = useState<string>('todos');
 const [user, setUser] = useState<any>(null);
 const [userType, setUserType] = useState<string>('');
 const [hasPersonalTrainer, setHasPersonalTrainer] = useState(false);

 const FILTERS = [
  { id: 'todos', label: 'Todos', icon: '' },
  { id: 'iniciante', label: 'Iniciante', icon: '🟢' },
  { id: 'intermediario', label: 'Intermediário', icon: '🟡' },
  { id: 'avancado', label: 'Avançado', icon: '🔴' },
  { id: 'meus', label: 'Meus', icon: '' },
 ];

 const loadTemplates = useCallback(async () => {
  try {
   setLoading(true);
   
   // Get both auth user and profile
   const authUser = await authService.getCurrentUser();
   const userProfile = await authService.getCurrentUserProfile();
   
   // Use auth user ID 
   const userId = authUser?.id;
   setUser({ ...userProfile, id: userId });
   setUserType(userProfile?.tipo || '');
   
   // Check if user has a personal trainer
   if (userProfile?.tipo === 'aluno') {
    const { data: trainerData } = await supabase
     .from('professional_clients')
     .select('trainer_id')
     .eq('client_id', userProfile?.user_id || userProfile?.id)
     .limit(1);
    
    setHasPersonalTrainer(trainerData && trainerData.length > 0);
   }
   
   const templatesData = await templateService.listarTemplates();
   setTemplates(templatesData);
  } catch (error: any) {
   console.error('Erro ao carregar templates:', error);
   Alert.alert('Erro', error.message || 'Erro desconhecido');
  } finally {
   setLoading(false);
  }
 }, []);

 const handleRefresh = useCallback(async () => {
  setRefreshing(true);
  await loadTemplates();
  setRefreshing(false);
 }, [loadTemplates]);

 useEffect(() => {
  loadTemplates();
 }, [loadTemplates]);

 // Listen for screen focus to refresh templates
 useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
   loadTemplates();
  });
  return unsubscribe;
 }, [navigation, loadTemplates]);

 const handleGoBack = useCallback(() => {
  Haptics.selectionAsync();
  navigation.goBack();
 }, [navigation]);

 const handleCreateTemplate = useCallback(() => {
  // Check if user has personal trainer and is a student
  if (userType === 'aluno' && hasPersonalTrainer) {
   Alert.alert(
    'Não é possível criar programa',
    'Você possui um personal trainer ativo. Apenas seu personal trainer pode criar e atribuir programas para você.\n\nConsulte seu personal trainer para que ele crie programas específicos para você.',
    [{ text: 'Entendi', style: 'default' }]
   );
   return;
  }
  
  Haptics.selectionAsync();
  navigation.navigate('CreateTemplate');
 }, [navigation, userType, hasPersonalTrainer]);

 const handleTemplatePress = useCallback((template: WorkoutTemplate) => {
  Haptics.selectionAsync();
  navigation.navigate('TemplateDetail', { template });
 }, [navigation]);

 const handleStartTemplate = useCallback(async (template: WorkoutTemplate) => {
  try {
   Alert.alert(
    'Iniciar Programa',
    `Deseja iniciar o programa "${template.nome}" com ${template.total_exercicios} exercícios?`,
    [
     { text: 'Cancelar', style: 'cancel' },
     {
      text: 'Iniciar',
      onPress: async () => {
       try {
        await templateService.iniciarTemplate(template.id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Navigate to program execution screen
        navigation.navigate('ProgramExecution', { template });
       } catch (error: any) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Erro', error.message || 'Não foi possível iniciar o programa');
       }
      }
     }
    ]
   );
  } catch (error: any) {
   Alert.alert('Erro', error.message || 'Erro desconhecido');
  }
 }, [navigation]);

 // Filtrar templates
 const filteredTemplates = templates.filter(template => {
  const matchesSearch = template.nome.toLowerCase().includes(searchText.toLowerCase()) ||
             (template.descricao?.toLowerCase().includes(searchText.toLowerCase()));
  
  if (!matchesSearch) return false;
  
  switch (filter) {
   case 'iniciante':
   case 'intermediario':
   case 'avancado':
    return template.nivel_dificuldade === filter;
   case 'meus':
    return template.created_by === user?.id;
   default:
    return true;
  }
 });

 const stats = {
  total: templates.length,
  iniciante: templates.filter(t => t.nivel_dificuldade === 'iniciante').length,
  intermediario: templates.filter(t => t.nivel_dificuldade === 'intermediario').length,
  avancado: templates.filter(t => t.nivel_dificuldade === 'avancado').length,
  meus: templates.filter(t => t.created_by === user?.id).length,
 };

 const getLevelColor = (nivel: string) => {
  switch (nivel) {
   case 'iniciante': return colors.accent.secondary;
   case 'intermediario': return colors.semantic.warning;
   case 'avancado': return colors.semantic.error;
   default: return colors.accent.primary;
  }
 };

 const getCategoryIcon = (categoria: string) => {
  switch (categoria) {
   case 'cardio': return <Icon name='health' size={16} color={colors.semantic.error} />;
   case 'forca': return '';
   case 'flexibilidade': return '🤸';
   case 'equilibrio': return <Icon name='target' size={16} color={colors.accent.primary} />;
   case 'funcional': return '🏃';
   case 'programa': return '';
   default: return <Icon name='settings' size={16} color={colors.text.secondary} />;
  }
 };

 const handleEditTemplate = useCallback((template: WorkoutTemplate) => {
  // Check if user has personal trainer and is a student
  if (userType === 'aluno' && hasPersonalTrainer) {
   Alert.alert(
    'Não é possível editar programa',
    'Você possui um personal trainer ativo. Apenas seu personal trainer pode criar e editar programas para você.\n\nConsulte seu personal trainer para que ele faça as alterações necessárias.',
    [{ text: 'Entendi', style: 'default' }]
   );
   return;
  }

  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  navigation.navigate('CreateTemplate', { template, isEditing: true });
 }, [navigation, userType, hasPersonalTrainer]);

 const handleDeleteTemplate = useCallback(async (template: WorkoutTemplate) => {
  // Check if user has personal trainer and is a student
  if (userType === 'aluno' && hasPersonalTrainer) {
   Alert.alert(
    'Não é possível excluir programa',
    'Você possui um personal trainer ativo. Apenas seu personal trainer pode gerenciar programas para você.\n\nConsulte seu personal trainer para que ele faça as alterações necessárias.',
    [{ text: 'Entendi', style: 'default' }]
   );
   return;
  }

  Alert.alert(
   'Excluir Programa',
   `Tem certeza que deseja excluir "${template.nome}"? Esta ação não pode ser desfeita.`,
   [
    { text: 'Cancelar', style: 'cancel' },
    {
     text: 'Excluir',
     style: 'destructive',
     onPress: async () => {
      try {
       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
       await templateService.excluirTemplate(template.id);
       loadTemplates();
       Alert.alert('Sucesso', 'Programa excluído com sucesso!');
      } catch (error: any) {
       Alert.alert('Erro', error.message || 'Não foi possível excluir o programa');
      }
     }
    }
   ]
  );
 }, [loadTemplates, userType, hasPersonalTrainer]);

 const handleMenuPress = useCallback((template: WorkoutTemplate) => {
  const isOwner = template.created_by === user?.id;
  
  if (isOwner) {
   // Menu para o dono
   Alert.alert(
    'Ações',
    `Escolha uma ação para "${template.nome}"`,
    [
     { text: 'Cancelar', style: 'cancel' },
     {
      text: 'Editar',
      onPress: () => handleEditTemplate(template)
     },
     {
      text: 'Excluir',
      style: 'destructive',
      onPress: () => handleDeleteTemplate(template)
     }
    ]
   );
  } else {
   // Menu para não-donos (vai copiar)
   Alert.alert(
    'Ações',
    `Escolha uma ação para "${template.nome}"`,
    [
     { text: 'Cancelar', style: 'cancel' },
     {
      text: 'Copiar e Editar',
      onPress: () => handleCopyAndEditTemplate(template)
     }
    ]
   );
  }
 }, [handleEditTemplate, handleDeleteTemplate, user?.id]);

 const handleCopyAndEditTemplate = useCallback((template: WorkoutTemplate) => {
  // Check if user has personal trainer and is a student
  if (userType === 'aluno' && hasPersonalTrainer) {
   Alert.alert(
    'Não é possível copiar programa',
    'Você possui um personal trainer ativo. Apenas seu personal trainer pode criar e editar programas para você.\n\nConsulte seu personal trainer para que ele crie programas específicos para você.',
    [{ text: 'Entendi', style: 'default' }]
   );
   return;
  }

  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  // Cria uma cópia do template sem o ID e com novo created_by
  const templateCopy = {
   ...template,
   id: undefined,
   nome: `Cópia de ${template.nome}`,
   created_by: user?.id,
   publico: false, // Cópia sempre é privada inicialmente
  };
  navigation.navigate('CreateTemplate', { 
   template: templateCopy, 
   isEditing: false, // Vai criar uma nova entrada
   isCopy: true 
  });
 }, [navigation, user?.id, userType, hasPersonalTrainer]);

 const renderTemplateItem = ({ item }: { item: WorkoutTemplate }) => (
  <TouchableOpacity
   onPress={() => handleTemplatePress(item)}
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
      <View style={{
       flexDirection: 'row',
       alignItems: 'center',
       gap: spacing.xs,
       marginBottom: spacing.xxs,
      }}>
       <Text style={{ fontSize: 16 }}>
        {getCategoryIcon(item.tipo_treino)}
       </Text>
       <Text style={[typography.presets.cardTitle, { flex: 1 }]}>
        {item.nome}
       </Text>
      </View>
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
      backgroundColor: getLevelColor(item.nivel_dificuldade),
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      marginLeft: spacing.sm,
     }}>
      <Text style={[
       typography.presets.caption,
       { color: colors.text.inverse, fontWeight: '600' }
      ]}>
       {item.nivel_dificuldade.toUpperCase()}
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
        Exercícios
       </Text>
       <Text style={[typography.presets.body, { fontWeight: '600' }]}>
        {item.total_exercicios || 0}
       </Text>
      </View>
      
      <View style={{ alignItems: 'center' }}>
       <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
        Duração Total
       </Text>
       <Text style={[typography.presets.body, { fontWeight: '600' }]}>
        {item.duracao_estimada_min || 0}min
       </Text>
      </View>
     </View>

     <View style={{ flexDirection: 'row', gap: spacing.xs }}>
      <TouchableOpacity
       onPress={() => handleMenuPress(item)}
       style={{
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: colors.surface.border,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
       }}
      >
       <Text style={{
        fontSize: 16,
        color: colors.text.primary,
       }}>
        ⋯
       </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
       onPress={() => handleStartTemplate(item)}
       style={{
        backgroundColor: colors.accent.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
       }}
      >
       <Text style={[
        typography.presets.caption,
        { color: colors.text.inverse, fontWeight: '600' }
       ]}>
        INICIAR
       </Text>
      </TouchableOpacity>
     </View>
    </View>

    <View style={{
     flexDirection: 'row',
     alignItems: 'center',
     gap: spacing.sm,
    }}>
     <Text style={typography.presets.caption}>
      📂 {item.tipo_treino}
     </Text>
     <View style={{
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.text.tertiary,
     }} />
     <Text style={[typography.presets.caption, { color: colors.text.tertiary }]}>
      {item.created_by === user?.id ? 
       'Criado por você' : 
       'por Usuário'
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
     placeholder="Buscar programas de treino..."
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

   {filteredTemplates.length === 0 && !loading && (
    <Card variant="glass" padding="lg" style={{ marginBottom: spacing.lg }}>
     <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>
       {searchText || filter !== 'todos' ? '' : ''}
      </Text>
      <Text style={[typography.presets.cardTitle, { textAlign: 'center', marginBottom: spacing.xs }]}>
       {searchText || filter !== 'todos' ? 'Nenhum programa encontrado' : 'Nenhum programa ainda'}
      </Text>
      <Text style={[typography.presets.body, { textAlign: 'center', marginBottom: spacing.md }]}>
       {searchText || filter !== 'todos'
        ? 'Tente buscar por outro termo ou filtro' 
        : 'Programas são conjuntos de vários exercícios'
       }
      </Text>
      <Text style={[typography.presets.caption, { textAlign: 'center', color: colors.text.tertiary, marginBottom: spacing.md }]}>
       Exemplo: "Barriga Tanquinho" com 5 exercícios de abdominais
      </Text>
      {(!searchText && filter === 'todos') && (
       <Button
        title="Criar Programa"
        onPress={handleCreateTemplate}
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
       Programas
     </Text>
     
     <Button
      title="Criar"
      onPress={handleCreateTemplate}
      variant="gradient"
      size="sm"
      icon={<Text style={{ fontSize: 14 }}>➕</Text>}
     />
    </View>

    <FlatList
     data={filteredTemplates}
     keyExtractor={(item) => item.id}
     renderItem={renderTemplateItem}
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