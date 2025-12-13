import React, { memo, useState } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import {
 colors,
 typography,
 spacing,
 borderRadius,
} from '../design-system';

interface SpotifyPlayerProps {
 style?: any;
}

// Predefined workout playlists from Spotify
const WORKOUT_PLAYLISTS = [
 {
  id: 'beast-mode',
  name: 'Beast Mode',
  description: 'Treino pesado',
  uri: '37i9dQZF1DX76Wlfdnj7AP', // Spotify's Beast Mode playlist
  embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX76Wlfdnj7AP?utm_source=generator',
  color: colors.semantic.error,
 },
 {
  id: 'power-workout',
  name: 'Power Workout',
  description: 'Energia máxima',
  uri: '37i9dQZF1DX0BcQWzuB7ZO', // Spotify's Power Workout playlist
  embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX0BcQWzuB7ZO?utm_source=generator',
  color: colors.accent.primary,
 },
 {
  id: 'cardio',
  name: 'Cardio Mix 💨',
  description: 'Ritmo para cardio',
  uri: '37i9dQZF1DX5ZQeD5rfXP0', // Spotify's Cardio playlist
  embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX5ZQeD5rfXP0?utm_source=generator',
  color: '#FF6B6B',
 },
 {
  id: 'strength',
  name: 'Força & Foco',
  description: 'Para musculação',
  uri: '37i9dQZF1DWUVpAXiEPK8P', // Spotify's Strength playlist
  embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWUVpAXiEPK8P?utm_source=generator',
  color: colors.accent.secondary,
 }
];

export const SpotifyPlayer = memo<SpotifyPlayerProps>(({ style }) => {
 const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
 const [showPlaylists, setShowPlaylists] = useState(false);
 const [showPlayer, setShowPlayer] = useState(false);

 const openInSpotify = async (playlist: any) => {
  const spotifyUrl = `spotify:playlist:${playlist.uri}`;
  const webUrl = `https://open.spotify.com/playlist/${playlist.uri}`;
  
  try {
   // Try to open in Spotify app first
   const canOpen = await Linking.canOpenURL(spotifyUrl);
   if (canOpen) {
    await Linking.openURL(spotifyUrl);
   } else {
    // Fallback to web version
    await Linking.openURL(webUrl);
   }
  } catch (error) {
   // Final fallback to web
   await Linking.openURL(webUrl);
  }
 };

 const selectPlaylist = (playlist: any) => {
  setSelectedPlaylist(playlist);
  setShowPlaylists(false);
  setShowPlayer(true);
  Haptics.selectionAsync();
 };

 if (showPlayer && selectedPlaylist) {
  return (
   <View style={[{
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surface.border,
   }, style]}>
    {/* Header */}
    <View style={{
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     padding: spacing.md,
     backgroundColor: selectedPlaylist.color + '20',
     borderBottomWidth: 1,
     borderBottomColor: colors.surface.border,
    }}>
     <View style={{ flex: 1 }}>
      <Text style={[
       typography.presets.body,
       { fontWeight: '600', color: selectedPlaylist.color }
      ]}>
       🎵 {selectedPlaylist.name}
      </Text>
      <Text style={[
       typography.presets.caption,
       { color: colors.text.secondary }
      ]}>
       {selectedPlaylist.description}
      </Text>
     </View>

     <View style={{ flexDirection: 'row', gap: spacing.xs }}>
      <TouchableOpacity
       onPress={() => openInSpotify(selectedPlaylist)}
       style={{
        backgroundColor: '#1DB954', // Spotify green
        borderRadius: borderRadius.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
       }}
      >
       <Text style={[
        typography.presets.caption,
        { color: 'white', fontWeight: '600' }
       ]}>
        Abrir Spotify
       </Text>
      </TouchableOpacity>

      <TouchableOpacity
       onPress={() => {
        setShowPlayer(false);
        setSelectedPlaylist(null);
       }}
       style={{
        backgroundColor: colors.background.tertiary,
        borderRadius: borderRadius.sm,
        padding: spacing.xs,
       }}
      >
       <Text style={{ fontSize: 16, color: colors.text.primary }}>✕</Text>
      </TouchableOpacity>
     </View>
    </View>

    {/* Spotify Embed */}
    <View style={{ 
     height: 200,
     backgroundColor: colors.background.secondary,
    }}>
     <WebView
      source={{ uri: selectedPlaylist.embedUrl }}
      style={{ 
       flex: 1,
       backgroundColor: colors.background.secondary,
      }}
      onError={(error) => {
       console.error('WebView Error:', error);
      }}
      startInLoadingState={true}
      renderLoading={() => (
       <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
       }}>
        <Text style={[typography.presets.body, { color: colors.text.secondary }]}>
         Carregando Spotify...
        </Text>
       </View>
      )}
      injectedJavaScript={`
       (function() {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = \`
         body, html { 
          margin: 0 !important; 
          padding: 0 !important; 
          background-color: transparent !important;
          overflow: hidden !important;
         }
         iframe { 
          background-color: transparent !important;
         }
         .spotify-player {
          background-color: transparent !important;
         }
        \`;
        document.head.appendChild(style);
       })();
       true;
      `}
     />
    </View>
   </View>
  );
 }

 if (showPlaylists) {
  return (
   <View style={[{
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
   }, style]}>
    {/* Header */}
    <View style={{
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: spacing.lg,
    }}>
     <Text style={[typography.presets.cardTitle]}>
      🎵 Playlists de Treino
     </Text>
     <TouchableOpacity
      onPress={() => setShowPlaylists(false)}
      style={{ padding: spacing.xs }}
     >
      <Text style={{ fontSize: 18, color: colors.text.secondary }}>✕</Text>
     </TouchableOpacity>
    </View>

    {/* Playlists Grid */}
    <View style={{
     flexDirection: 'row',
     flexWrap: 'wrap',
     gap: spacing.sm,
    }}>
     {WORKOUT_PLAYLISTS.map((playlist) => (
      <TouchableOpacity
       key={playlist.id}
       onPress={() => selectPlaylist(playlist)}
       style={{
        backgroundColor: playlist.color + '15',
        borderWidth: 2,
        borderColor: playlist.color,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        minWidth: '45%',
        alignItems: 'center',
       }}
      >
       <Text style={[
        typography.presets.body,
        { 
         fontWeight: '600', 
         color: playlist.color,
         textAlign: 'center',
         marginBottom: spacing.xs
        }
       ]}>
        {playlist.name}
       </Text>
       <Text style={[
        typography.presets.caption,
        { 
         color: colors.text.secondary,
         textAlign: 'center'
        }
       ]}>
        {playlist.description}
       </Text>
      </TouchableOpacity>
     ))}
    </View>

    <Text style={[
     typography.presets.caption,
     { 
      color: colors.text.tertiary,
      textAlign: 'center',
      marginTop: spacing.md
     }
    ]}>
     Dica: Mantenha o Spotify tocando em segundo plano para melhor experiência
    </Text>
   </View>
  );
 }

 // Compact button when closed
 return (
  <TouchableOpacity
   onPress={() => setShowPlaylists(true)}
   style={[{
    backgroundColor: '#1DB954' + '20', // Spotify green with transparency
    borderWidth: 2,
    borderColor: '#1DB954',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
   }, style]}
  >
   <Text style={{ fontSize: 24 }}>🎵</Text>
   <View>
    <Text style={[
     typography.presets.body,
     { 
      fontWeight: '600', 
      color: '#1DB954',
      textAlign: 'center'
     }
    ]}>
     Música para Treino
    </Text>
    <Text style={[
     typography.presets.caption,
     { 
      color: colors.text.secondary,
      textAlign: 'center'
     }
    ]}>
     Toque para escolher playlist
    </Text>
   </View>
  </TouchableOpacity>
 );
});