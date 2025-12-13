import React, { memo, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import {
 colors,
 typography,
 spacing,
 borderRadius,
} from '../design-system';

interface YouTubePlayerProps {
 videoUrl?: string;
 height?: number;
 style?: any;
}

// Function to extract YouTube video ID from various URL formats
const extractVideoId = (url: string): string | null => {
 if (!url) return null;

 const patterns = [
  /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
  /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
 ];

 for (const pattern of patterns) {
  const match = url.match(pattern);
  if (match) return match[1];
 }

 return null;
};

export const YouTubePlayer = memo<YouTubePlayerProps>(({ 
 videoUrl, 
 height = 200,
 style 
}) => {
 const [playing, setPlaying] = useState(false);
 const [showPlayer, setShowPlayer] = useState(false);

 if (!videoUrl) return null;

 const videoId = extractVideoId(videoUrl);
 
 if (!videoId) {
  return (
   <View style={[{
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
   }, style]}>
    <Text style={[
     typography.presets.caption,
     { color: colors.text.tertiary, textAlign: 'center' }
    ]}>
     URL do vídeo inválida
    </Text>
   </View>
  );
 }

 if (!showPlayer) {
  return (
   <TouchableOpacity
    onPress={() => setShowPlayer(true)}
    style={[{
     backgroundColor: colors.background.secondary,
     borderRadius: borderRadius.md,
     padding: spacing.lg,
     borderWidth: 1,
     borderColor: colors.surface.border,
     alignItems: 'center',
     justifyContent: 'center',
     minHeight: height,
    }, style]}
   >
    <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>play</Text>
    <Text style={[
     typography.presets.body,
     { 
      color: colors.accent.primary, 
      fontWeight: '600',
      textAlign: 'center' 
     }
    ]}>
     Assistir demonstração
    </Text>
    <Text style={[
     typography.presets.caption,
     { 
      color: colors.text.secondary,
      textAlign: 'center',
      marginTop: spacing.xs
     }
    ]}>
     Toque para carregar o vídeo do YouTube
    </Text>
   </TouchableOpacity>
  );
 }

 return (
  <View style={[{
   backgroundColor: colors.background.secondary,
   borderRadius: borderRadius.md,
   overflow: 'hidden',
   borderWidth: 1,
   borderColor: colors.surface.border,
  }, style]}>
   <YoutubePlayer
    height={height}
    play={playing}
    videoId={videoId}
    onChangeState={(state) => {
     if (state === 'ended') {
      setPlaying(false);
     }
    }}
    onError={(error) => {
     console.error('YouTube Player Error:', error);
     Alert.alert(
      'Erro no vídeo',
      'Não foi possível carregar o vídeo. Verifique sua conexão com a internet.'
     );
    }}
    webViewProps={{
     injectedJavaScript: `
      var element = document.getElementsByClassName('container')[0];
      element.style.position = 'unset';
      element.style.paddingBottom = 'unset';
      true;
     `,
    }}
   />
   
   <View style={{
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.background.primary + '90',
   }}>
    <TouchableOpacity
     onPress={() => setPlaying(!playing)}
     style={{
      backgroundColor: colors.accent.primary,
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginRight: spacing.sm,
     }}
    >
     <Text style={[
      typography.presets.caption,
      { color: 'white', fontWeight: '600' }
     ]}>
      {playing ? 'pause Pausar' : 'play Play'}
     </Text>
    </TouchableOpacity>
    
    <TouchableOpacity
     onPress={() => {
      setShowPlayer(false);
      setPlaying(false);
     }}
     style={{
      backgroundColor: colors.background.tertiary,
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
     }}
    >
     <Text style={[
      typography.presets.caption,
      { color: colors.text.primary, fontWeight: '600' }
     ]}>
      close Fechar
     </Text>
    </TouchableOpacity>
   </View>
  </View>
 );
});