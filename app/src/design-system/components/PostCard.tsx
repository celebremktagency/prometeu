import React, { memo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { borderRadius, spacing } from '../tokens/spacing';
import { shadows } from '../tokens/shadows';
import { Avatar } from './Avatar';

interface PostCardProps {
 post: {
  id: string;
  titulo: string;
  conteudo: string;
  autor_nome?: string;
  tipo: string;
  curtidas: number;
  comentarios_count: number;
  visualizacoes: number;
  created_at: string;
 };
 onLike?: (postId: string) => void;
 onComment?: (postId: string) => void;
 onShare?: (postId: string) => void;
}

export const PostCard = memo<PostCardProps>(({ 
 post, 
 onLike,
 onComment,
 onShare 
}) => {
 const [isLiked, setIsLiked] = useState(false);
 const [localLikes, setLocalLikes] = useState(post.curtidas);

 const handleLike = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  setIsLiked(!isLiked);
  setLocalLikes(prev => isLiked ? prev - 1 : prev + 1);
  onLike?.(post.id);
 };

 const handleComment = () => {
  Haptics.selectionAsync();
  onComment?.(post.id);
 };

 const handleShare = () => {
  Haptics.selectionAsync();
  onShare?.(post.id);
 };

 const getTimeAgo = (dateString: string) => {
  const now = new Date();
  const postDate = new Date(dateString);
  const diffInMs = now.getTime() - postDate.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
   return `${diffInDays}d`;
  } else if (diffInHours > 0) {
   return `${diffInHours}h`;
  } else {
   return 'agora';
  }
 };

 const getPostTypeIcon = (tipo: string) => {
  switch (tipo.toLowerCase()) {
   case 'pergunta': return '❓';
   case 'dica': return '';
   case 'motivacao': return 'exercise';
   case 'conquista': return '';
   default: return '';
  }
 };

 return (
  <View style={[styles.container, shadows.sm]}>
   {/* Header do Post */}
   <View style={styles.header}>
    <Avatar 
     name={post.autor_nome || 'Usuário'} 
     size="sm" 
     showBorder={false}
    />
    
    <View style={styles.authorInfo}>
     <View style={styles.authorRow}>
      <Text style={styles.authorName}>
       {post.autor_nome || 'Usuário Anônimo'}
      </Text>
      <View style={styles.postTypeBadge}>
       <Text style={styles.postTypeIcon}>
        {getPostTypeIcon(post.tipo)}
       </Text>
       <Text style={styles.postTypeText}>{post.tipo}</Text>
      </View>
     </View>
     
     <Text style={styles.timeAgo}>
      {getTimeAgo(post.created_at)}
     </Text>
    </View>
   </View>

   {/* Conteúdo do Post */}
   <View style={styles.content}>
    <Text style={styles.title}>{post.titulo}</Text>
    <Text style={styles.body}>{post.conteudo}</Text>
   </View>

   {/* Estatísticas */}
   <View style={styles.stats}>
    <View style={styles.statItem}>
     <Text style={styles.statIcon}>eye</Text>
     <Text style={styles.statText}>{post.visualizacoes}</Text>
    </View>
    
    <View style={styles.statItem}>
     <Text style={styles.statIcon}>💬</Text>
     <Text style={styles.statText}>{post.comentarios_count}</Text>
    </View>
    
    <View style={styles.statItem}>
     <Text style={styles.statIcon}>heart</Text>
     <Text style={styles.statText}>{localLikes}</Text>
    </View>
   </View>

   {/* Ações */}
   <View style={styles.actions}>
    <TouchableOpacity
     onPress={handleLike}
     style={[
      styles.actionButton,
      isLiked && styles.actionButtonLiked
     ]}
     activeOpacity={0.7}
    >
     <Text style={[
      styles.actionIcon,
      isLiked && { color: colors.semantic.error }
     ]}>
      {isLiked ? 'heart' : 'heart'}
     </Text>
     <Text style={[
      styles.actionText,
      isLiked && { color: colors.semantic.error }
     ]}>
      Curtir
     </Text>
    </TouchableOpacity>

    <TouchableOpacity
     onPress={handleComment}
     style={styles.actionButton}
     activeOpacity={0.7}
    >
     <Text style={styles.actionIcon}>💬</Text>
     <Text style={styles.actionText}>Comentar</Text>
    </TouchableOpacity>

    <TouchableOpacity
     onPress={handleShare}
     style={styles.actionButton}
     activeOpacity={0.7}
    >
     <Text style={styles.actionIcon}>📤</Text>
     <Text style={styles.actionText}>Compartilhar</Text>
    </TouchableOpacity>
   </View>
  </View>
 );
});

const styles = StyleSheet.create({
 container: {
  backgroundColor: colors.background.secondary,
  borderRadius: borderRadius.xl,
  marginBottom: spacing.md,
  overflow: 'hidden',
 },
 header: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: spacing.md,
  paddingBottom: spacing.sm,
 },
 authorInfo: {
  flex: 1,
  marginLeft: spacing.sm,
 },
 authorRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: spacing.xxs,
 },
 authorName: {
  ...typography.presets.cardTitle,
  flex: 1,
 },
 postTypeBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.surface.card,
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
  borderRadius: borderRadius.sm,
 },
 postTypeIcon: {
  fontSize: 12,
  marginRight: spacing.xxs,
 },
 postTypeText: {
  fontSize: typography.sizes.xs,
  color: colors.text.secondary,
  textTransform: 'capitalize',
 },
 timeAgo: {
  fontSize: typography.sizes.xs,
  color: colors.text.tertiary,
 },
 content: {
  paddingHorizontal: spacing.md,
  paddingBottom: spacing.sm,
 },
 title: {
  ...typography.presets.cardTitle,
  marginBottom: spacing.xs,
  lineHeight: 22,
 },
 body: {
  ...typography.presets.body,
  lineHeight: 20,
 },
 stats: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xs,
  borderTopWidth: 1,
  borderTopColor: colors.surface.divider,
 },
 statItem: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xxs,
 },
 statIcon: {
  fontSize: 14,
 },
 statText: {
  fontSize: typography.sizes.sm,
  color: colors.text.secondary,
 },
 actions: {
  flexDirection: 'row',
  borderTopWidth: 1,
  borderTopColor: colors.surface.divider,
 },
 actionButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: spacing.sm,
  gap: spacing.xs,
 },
 actionButtonLiked: {
  backgroundColor: 'rgba(255, 71, 87, 0.1)',
 },
 actionIcon: {
  fontSize: 16,
 },
 actionText: {
  fontSize: typography.sizes.sm,
  color: colors.text.secondary,
  fontWeight: '500',
 },
});