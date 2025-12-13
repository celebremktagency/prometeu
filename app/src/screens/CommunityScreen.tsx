import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { 
 View, 
 Text, 
 ScrollView, 
 Alert, 
 TouchableOpacity,
 FlatList,
 RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import {
 colors,
 typography,
 spacing,
 borderRadius,
 Button,
 Card,
 PostCard,
 CreatePostModal,
 MetricCard,
} from '../design-system';
import { communityService } from '../services/communityService';
import { authService } from '../services/authService';

interface CommunityScreenProps {
 navigation: any;
}

export const CommunityScreen = memo<CommunityScreenProps>(({ navigation }) => {
 const [posts, setPosts] = useState<any[]>([]);
 const [user, setUser] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [createModalVisible, setCreateModalVisible] = useState(false);
 const [createPostLoading, setCreatePostLoading] = useState(false);
 const [filter, setFilter] = useState<string>('todos');

 const FILTERS = [
  { id: 'todos', label: 'Todos', icon: '' },
  { id: 'pergunta', label: 'Perguntas', icon: '❓' },
  { id: 'dica', label: 'Dicas', icon: '' },
  { id: 'motivacao', label: 'Motivação', icon: '' },
  { id: 'conquista', label: 'Conquistas', icon: '' },
 ];

 const loadData = useCallback(async () => {
  try {
   setLoading(true);
   const [userProfile, postsData] = await Promise.all([
    authService.getCurrentUserProfile(),
    communityService.listarPosts(),
   ]);
   
   setUser(userProfile);
   setPosts(postsData);
  } catch (error: any) {
   console.error('Erro ao carregar dados:', error);
   Alert.alert('Erro', 'Não foi possível carregar os dados da comunidade');
  } finally {
   setLoading(false);
  }
 }, []);

 const handleRefresh = useCallback(async () => {
  setRefreshing(true);
  await loadData();
  setRefreshing(false);
 }, [loadData]);

 useEffect(() => {
  loadData();
 }, [loadData]);

 // Filtrar posts baseado no filtro selecionado
 const filteredPosts = useMemo(() => {
  if (filter === 'todos') {
   return posts;
  }
  return posts.filter(post => post.tipo === filter);
 }, [posts, filter]);

 // Calcular estatísticas
 const stats = useMemo(() => {
  const totalPosts = posts.length;
  const myPosts = posts.filter(p => p.autor_id === user?.id).length;
  const todayPosts = posts.filter(p => 
   new Date(p.created_at).toDateString() === new Date().toDateString()
  ).length;

  return { totalPosts, myPosts, todayPosts };
 }, [posts, user]);

 const handleCreatePost = useCallback(() => {
  Haptics.selectionAsync();
  setCreateModalVisible(true);
 }, []);

 const handleCloseModal = useCallback(() => {
  setCreateModalVisible(false);
 }, []);

 const handleSubmitPost = useCallback(async (postData: { 
  titulo: string; 
  conteudo: string; 
  tipo: string 
 }) => {
  try {
   setCreatePostLoading(true);
   await communityService.criarPost(
    postData.titulo, 
    postData.conteudo, 
    postData.tipo
   );
   
   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
   Alert.alert('Sucesso', 'Post criado com sucesso!');
   setCreateModalVisible(false);
   
   // Recarregar posts
   await loadData();
  } catch (error: any) {
   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
   Alert.alert('Erro', error.message);
  } finally {
   setCreatePostLoading(false);
  }
 }, [loadData]);

 const handleLikePost = useCallback((postId: string) => {
  // Implementar curtida (futuro)
  console.log('Curtir post:', postId);
 }, []);

 const handleCommentPost = useCallback((postId: string) => {
  Haptics.selectionAsync();
  // Implementar comentários (futuro)
  Alert.alert('Em breve', 'Funcionalidade de comentários em desenvolvimento');
 }, []);

 const handleSharePost = useCallback((postId: string) => {
  Haptics.selectionAsync();
  // Implementar compartilhamento (futuro)
  Alert.alert('Em breve', 'Funcionalidade de compartilhamento em desenvolvimento');
 }, []);

 const selectFilter = useCallback((filterId: string) => {
  Haptics.selectionAsync();
  setFilter(filterId);
 }, []);

 const renderPostItem = useCallback(({ item }: { item: any }) => (
  <PostCard
   post={item}
   onLike={handleLikePost}
   onComment={handleCommentPost}
   onShare={handleSharePost}
  />
 ), [handleLikePost, handleCommentPost, handleSharePost]);

 const renderHeader = () => (
  <>
   {/* Header */}
   <View style={{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
   }}>
    <TouchableOpacity onPress={() => navigation.goBack()}>
     <Text style={{ fontSize: 24 }}>←</Text>
    </TouchableOpacity>
    
    <Text style={typography.presets.screenTitle}>
      Comunidade
    </Text>
    
    <Button
     title="Criar"
     onPress={handleCreatePost}
     variant="gradient"
     size="sm"
     icon={<Ionicons name="create-outline" size={20} color={colors.text.primary} />}
    />
   </View>

   {/* Estatísticas */}
   <View style={{
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
   }}>
    <MetricCard
     value={stats.totalPosts}
     label="Posts"
     icon={<Ionicons name="create-outline" size={20} color={colors.text.secondary} />}
     accentColor={colors.accent.primary}
     size="sm"
    />
    <MetricCard
     value={stats.myPosts}
     label="Meus"
     icon={<Ionicons name="person-outline" size={20} color={colors.text.primary} />}
     accentColor={colors.accent.secondary}
     size="sm"
    />
    <MetricCard
     value={stats.todayPosts}
     label="Hoje"
     icon={<Ionicons name="calendar-outline" size={20} color={colors.accent.primary} />}
     accentColor={colors.semantic.info}
     size="sm"
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
     Filtrar por tipo
    </Text>
    
    <ScrollView
     horizontal
     showsHorizontalScrollIndicator={false}
     contentContainerStyle={{ gap: spacing.sm }}
    >
     {FILTERS.map((filterItem) => (
      <TouchableOpacity
       key={filterItem.id}
       onPress={() => selectFilter(filterItem.id)}
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
        borderRadius: borderRadius.lg,
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
    </ScrollView>
   </View>

   {/* Estado dos Posts */}
   {filteredPosts.length === 0 && !loading && (
    <Card variant="glass" padding="lg" style={{ marginBottom: spacing.lg }}>
     <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>
       {filter === 'todos' ? '💭' : FILTERS.find(f => f.id === filter)?.icon}
      </Text>
      <Text style={[typography.presets.cardTitle, { textAlign: 'center', marginBottom: spacing.xs }]}>
       {filter === 'todos' 
        ? 'Ainda não há posts' 
        : `Nenhum post de ${FILTERS.find(f => f.id === filter)?.label.toLowerCase()}`
       }
      </Text>
      <Text style={[typography.presets.body, { textAlign: 'center', marginBottom: spacing.md }]}>
       Seja o primeiro a compartilhar algo interessante!
      </Text>
      <Button
       title="Criar Post"
       onPress={handleCreatePost}
       variant="secondary"
       size="sm"
      />
     </View>
    </Card>
   )}
  </>
 );

 return (
  <LinearGradient
   colors={[colors.background.primary, colors.background.secondary]}
   style={{ flex: 1 }}
  >
   <SafeAreaView style={{ flex: 1 }}>
    <FlatList
     data={filteredPosts}
     keyExtractor={(item) => item.id}
     renderItem={renderPostItem}
     ListHeaderComponent={renderHeader}
     contentContainerStyle={{
      paddingHorizontal: spacing.screenHorizontal,
      paddingVertical: spacing.screenVertical,
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
     // Performance optimizations
     removeClippedSubviews={true}
     maxToRenderPerBatch={10}
     windowSize={10}
     initialNumToRender={8}
     getItemLayout={(data, index) => ({
      length: 200, // Estimated height
      offset: 200 * index,
      index,
     })}
    />

    {/* Floating Action Button */}
    <TouchableOpacity
     onPress={handleCreatePost}
     style={{
      position: 'absolute',
      bottom: spacing.xl + 20,
      right: spacing.xl,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: colors.accent.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
     }}
    >
     <LinearGradient
      colors={colors.gradients.progress}
      style={{
       width: '100%',
       height: '100%',
       borderRadius: 28,
       justifyContent: 'center',
       alignItems: 'center',
      }}
     >
      <Text style={{ fontSize: 24, color: colors.text.inverse }}>edit</Text>
     </LinearGradient>
    </TouchableOpacity>

    {/* Modal de Criação */}
    <CreatePostModal
     visible={createModalVisible}
     onClose={handleCloseModal}
     onSubmit={handleSubmitPost}
     loading={createPostLoading}
    />
   </SafeAreaView>
  </LinearGradient>
 );
});