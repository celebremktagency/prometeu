import React, { memo, useState } from 'react';
import { View, Text, TouchableOpacity, Linking, Alert, Image } from 'react-native';
import { colors } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { spacing, borderRadius } from '../tokens/spacing';

interface YouTubePreviewProps {
 url: string;
 title?: string;
 style?: any;
}

export const YouTubePreview = memo<YouTubePreviewProps>(({ url, title, style }) => {
 const [thumbnailError, setThumbnailError] = useState(false);

 // Extract YouTube video ID from URL
 const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
 };

 // Get thumbnail URL from video ID
 const getThumbnailUrl = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
 };

 const handlePress = async () => {
  try {
   await Linking.openURL(url);
  } catch (error) {
   Alert.alert('Erro', 'Não foi possível abrir o vídeo');
  }
 };

 const videoId = getYouTubeVideoId(url);
 const thumbnailUrl = videoId ? getThumbnailUrl(videoId) : null;

 if (!videoId) {
  return (
   <TouchableOpacity
    onPress={handlePress}
    style={[
     {
      backgroundColor: colors.surface.card,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.surface.border,
     },
     style,
    ]}
   >
    <Text style={{ fontSize: 20 }}>🎥</Text>
    <View style={{ flex: 1 }}>
     <Text style={[typography.presets.body, { fontWeight: '600' }]}>
      {title || 'Vídeo no YouTube'}
     </Text>
     <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
      Toque para assistir
     </Text>
    </View>
    <Text style={{ fontSize: 16, color: colors.accent.primary }}>→</Text>
   </TouchableOpacity>
  );
 }

 return (
  <TouchableOpacity
   onPress={handlePress}
   activeOpacity={0.8}
   style={[
    {
     backgroundColor: colors.surface.card,
     borderRadius: borderRadius.md,
     overflow: 'hidden',
     borderWidth: 1,
     borderColor: colors.surface.border,
    },
    style,
   ]}
  >
   {/* Thumbnail */}
   <View style={{ position: 'relative' }}>
    {thumbnailUrl && !thumbnailError ? (
     <Image
      source={{ uri: thumbnailUrl }}
      style={{
       width: '100%',
       height: 180,
       backgroundColor: colors.background.secondary,
      }}
      onError={() => setThumbnailError(true)}
     />
    ) : (
     <View style={{
      width: '100%',
      height: 180,
      backgroundColor: colors.background.secondary,
      justifyContent: 'center',
      alignItems: 'center',
     }}>
      <Text style={{ fontSize: 48, opacity: 0.5 }}>🎥</Text>
      <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
       Prévia não disponível
      </Text>
     </View>
    )}
    
    {/* Play Button Overlay */}
    <View style={{
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     justifyContent: 'center',
     alignItems: 'center',
     backgroundColor: 'rgba(0,0,0,0.3)',
    }}>
     <View style={{
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.accent.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
     }}>
      <Text style={{ 
       fontSize: 24, 
       color: colors.text.inverse,
       marginLeft: 2, // Slight offset to center the play triangle
      }}>
       play
      </Text>
     </View>
    </View>
   </View>

   {/* Info */}
   <View style={{ padding: spacing.md }}>
    <Text style={[typography.presets.body, { fontWeight: '600', marginBottom: spacing.xs }]}>
     {title || 'Vídeo Demonstrativo'}
    </Text>
    <Text style={[typography.presets.caption, { color: colors.text.secondary }]}>
     Toque para assistir no YouTube
    </Text>
   </View>
  </TouchableOpacity>
 );
});