import React from 'react';
import { ViewStyle } from 'react-native';
import { 
 Ionicons,
 MaterialIcons,
 MaterialCommunityIcons,
 Feather,
 FontAwesome5,
 AntDesign,
 Entypo
} from '@expo/vector-icons';
import { colors } from '../tokens/colors';

// Tipos de ícones disponíveis
type IconFamily = 'Ionicons' | 'MaterialIcons' | 'MaterialCommunityIcons' | 'Feather' | 'FontAwesome5' | 'AntDesign' | 'Entypo';

// Mapeamento de ícones comuns do app
export const iconMap = {
 // Navegação e UI
 'arrow-back': { family: 'Ionicons' as IconFamily, name: 'arrow-back' },
 'arrow-forward': { family: 'Ionicons' as IconFamily, name: 'arrow-forward' },
 'close': { family: 'Ionicons' as IconFamily, name: 'close' },
 'menu': { family: 'Ionicons' as IconFamily, name: 'menu' },
 'more': { family: 'Ionicons' as IconFamily, name: 'ellipsis-horizontal' },
 'settings': { family: 'Ionicons' as IconFamily, name: 'settings-outline' },
 'search': { family: 'Ionicons' as IconFamily, name: 'search' },
 
 // Perfil e usuário
 'user': { family: 'Ionicons' as IconFamily, name: 'person' },
 'edit': { family: 'Ionicons' as IconFamily, name: 'create' },
 'camera': { family: 'Ionicons' as IconFamily, name: 'camera' },
 'logout': { family: 'Ionicons' as IconFamily, name: 'log-out' },
 
 // Fitness e treinos
 'fitness': { family: 'MaterialIcons' as IconFamily, name: 'fitness-center' },
 'workout': { family: 'MaterialCommunityIcons' as IconFamily, name: 'dumbbell' },
 'exercise': { family: 'MaterialCommunityIcons' as IconFamily, name: 'run' },
 'timer': { family: 'Ionicons' as IconFamily, name: 'timer' },
 'play': { family: 'Ionicons' as IconFamily, name: 'play' },
 'pause': { family: 'Ionicons' as IconFamily, name: 'pause' },
 'stop': { family: 'Ionicons' as IconFamily, name: 'stop' },
 'strength': { family: 'MaterialCommunityIcons' as IconFamily, name: 'weight-lifter' },
 
 // Health e dor
 'health': { family: 'Ionicons' as IconFamily, name: 'heart' },
 'pain': { family: 'MaterialCommunityIcons' as IconFamily, name: 'emoticon-sad' },
 'medical': { family: 'Ionicons' as IconFamily, name: 'medical' },
 'heartbeat': { family: 'FontAwesome5' as IconFamily, name: 'heartbeat' },
 
 // Progresso e estatísticas
 'chart': { family: 'Ionicons' as IconFamily, name: 'stats-chart' },
 'progress': { family: 'MaterialCommunityIcons' as IconFamily, name: 'progress-check' },
 'trending-up': { family: 'Ionicons' as IconFamily, name: 'trending-up' },
 'target': { family: 'MaterialCommunityIcons' as IconFamily, name: 'target' },
 'trophy': { family: 'Ionicons' as IconFamily, name: 'trophy' },
 'medal': { family: 'MaterialCommunityIcons' as IconFamily, name: 'medal' },
 'fire': { family: 'MaterialCommunityIcons' as IconFamily, name: 'fire' },
 
 // Calendar e tempo
 'calendar': { family: 'Ionicons' as IconFamily, name: 'calendar' },
 'time': { family: 'Ionicons' as IconFamily, name: 'time' },
 'today': { family: 'MaterialIcons' as IconFamily, name: 'today' },
 'schedule': { family: 'MaterialIcons' as IconFamily, name: 'schedule' },
 
 // Comunicação e social
 'notification': { family: 'Ionicons' as IconFamily, name: 'notifications' },
 'message': { family: 'Ionicons' as IconFamily, name: 'chatbubble' },
 'share': { family: 'Ionicons' as IconFamily, name: 'share' },
 'community': { family: 'MaterialCommunityIcons' as IconFamily, name: 'account-group' },
 'connect': { family: 'MaterialCommunityIcons' as IconFamily, name: 'connection' },
 'handshake': { family: 'MaterialCommunityIcons' as IconFamily, name: 'handshake' },
 
 // Ações gerais
 'add': { family: 'Ionicons' as IconFamily, name: 'add' },
 'remove': { family: 'Ionicons' as IconFamily, name: 'remove' },
 'check': { family: 'Ionicons' as IconFamily, name: 'checkmark' },
 'favorite': { family: 'Ionicons' as IconFamily, name: 'heart' },
 'bookmark': { family: 'Ionicons' as IconFamily, name: 'bookmark' },
 'download': { family: 'Ionicons' as IconFamily, name: 'download' },
 'upload': { family: 'Ionicons' as IconFamily, name: 'cloud-upload' },
 
 // Personal Trainer específicos
 'clients': { family: 'MaterialCommunityIcons' as IconFamily, name: 'account-multiple' },
 'trainer': { family: 'MaterialCommunityIcons' as IconFamily, name: 'account-tie' },
 'template': { family: 'MaterialCommunityIcons' as IconFamily, name: 'clipboard-outline' },
 'library': { family: 'MaterialIcons' as IconFamily, name: 'library-books' },
 'create': { family: 'MaterialCommunityIcons' as IconFamily, name: 'plus-circle-outline' },
 'invite': { family: 'MaterialCommunityIcons' as IconFamily, name: 'email-outline' },
 'code': { family: 'MaterialCommunityIcons' as IconFamily, name: 'qrcode' },
 
 // Status e feedback
 'success': { family: 'Ionicons' as IconFamily, name: 'checkmark-circle' },
 'error': { family: 'Ionicons' as IconFamily, name: 'close-circle' },
 'warning': { family: 'Ionicons' as IconFamily, name: 'warning' },
 'info': { family: 'Ionicons' as IconFamily, name: 'information-circle' },
 'loading': { family: 'MaterialCommunityIcons' as IconFamily, name: 'loading' },
 
 // Formulários e inputs
 'eye': { family: 'Ionicons' as IconFamily, name: 'eye' },
 'eye-off': { family: 'Ionicons' as IconFamily, name: 'eye-off' },
 
 // Mídia e conteúdo
 'video': { family: 'Ionicons' as IconFamily, name: 'videocam' },
 'music': { family: 'Ionicons' as IconFamily, name: 'musical-notes' },
 'image': { family: 'Ionicons' as IconFamily, name: 'image' },
 'spotify': { family: 'FontAwesome5' as IconFamily, name: 'spotify' },
 'youtube': { family: 'FontAwesome5' as IconFamily, name: 'youtube' },
} as const;

export type IconName = keyof typeof iconMap;

interface IconProps {
 name: IconName;
 size?: number;
 color?: string;
 style?: ViewStyle;
}

const IconComponents = {
 Ionicons,
 MaterialIcons,
 MaterialCommunityIcons,
 Feather,
 FontAwesome5,
 AntDesign,
 Entypo,
};

export const Icon: React.FC<IconProps> = ({
 name,
 size = 24,
 color = colors.text.primary,
 style,
}) => {
 const iconConfig = iconMap[name];
 
 if (!iconConfig) {
  console.warn(`Icon "${name}" not found in iconMap`);
  return null;
 }

 const IconComponent = IconComponents[iconConfig.family] as any;
 
 return (
  <IconComponent
   name={iconConfig.name}
   size={size}
   color={color}
   style={style}
  />
 );
};

// Hook para facilitar o uso
export const useIcon = () => {
 return { Icon, iconMap };
};