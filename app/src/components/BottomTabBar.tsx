import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
 colors,
 typography,
 spacing,
 borderRadius,
} from '../design-system';

interface TabItem {
 key: string;
 label: string;
 icon: keyof typeof Ionicons.glyphMap;
 screen: string;
}

interface BottomTabBarProps {
 currentRoute: string;
 navigation: any;
 userType?: 'client' | 'trainer';
}

export const BottomTabBar = memo<BottomTabBarProps>(({ currentRoute, navigation, userType = 'client' }) => {
 
 const clientTabs: TabItem[] = [
  { key: 'home', label: 'Início', icon: 'home-outline', screen: 'Home' },
  { key: 'workouts', label: 'Exercícios', icon: 'fitness-outline', screen: 'WorkoutLibrary' },
  { key: 'programs', label: 'Programas', icon: 'clipboard-outline', screen: 'WorkoutTemplates' },
  { key: 'progress', label: 'Progresso', icon: 'trending-up-outline', screen: 'Progress' },
  { key: 'profile', label: 'Perfil', icon: 'person-outline', screen: 'Profile' },
 ];

 const trainerTabs: TabItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'trending-up-outline', screen: 'ProfessionalDashboard' },
  { key: 'clients', label: 'Clientes', icon: 'people-outline', screen: 'ClientList' },
  { key: 'workouts', label: 'Exercícios', icon: 'fitness-outline', screen: 'WorkoutLibrary' },
  { key: 'programs', label: 'Programas', icon: 'clipboard-outline', screen: 'WorkoutTemplates' },
  { key: 'profile', label: 'Perfil', icon: 'person-outline', screen: 'Profile' },
 ];

 const tabs = userType === 'trainer' ? trainerTabs : clientTabs;

 const handleTabPress = (screen: string) => {
  if (currentRoute !== screen) {
   navigation.navigate(screen);
  }
 };

 const getTabKey = (routeName: string): string => {
  const tab = tabs.find(t => t.screen === routeName);
  return tab?.key || 'home';
 };

 const isActive = (tabKey: string): boolean => {
  return getTabKey(currentRoute) === tabKey;
 };

 return (
  <SafeAreaView edges={['bottom']} style={{
   backgroundColor: 'rgba(0, 0, 0, 0.9)',
   borderTopWidth: 1,
   borderTopColor: colors.surface.border + '40',
  }}>
   <View style={{
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 80,
    backgroundColor: 'transparent',
   }}>
    {tabs.map((tab) => {
     const active = isActive(tab.key);
     
     return (
      <TouchableOpacity
       key={tab.key}
       onPress={() => handleTabPress(tab.screen)}
       style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        backgroundColor: active ? colors.accent.primary + '25' : 'transparent',
        marginHorizontal: spacing.xxs,
       }}
       activeOpacity={0.8}
      >
       <Ionicons 
        name={active ? tab.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap : tab.icon}
        size={24}
        color={active ? colors.accent.primary : colors.text.secondary}
        style={{
         marginBottom: spacing.xxs,
         opacity: active ? 1 : 0.8,
        }}
       />
       <Text style={{
        fontSize: typography.sizes.xs,
        fontWeight: active ? '700' : '500',
        color: active ? colors.accent.primary : colors.text.secondary,
        textAlign: 'center',
        opacity: active ? 1 : 0.8,
       }}>
        {tab.label}
       </Text>
      </TouchableOpacity>
     );
    })}
   </View>
  </SafeAreaView>
 );
});