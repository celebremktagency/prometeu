import React, { memo } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { BottomTabBar } from './BottomTabBar';
import { useUserType } from '../hooks/useUserType';
import { colors } from '../design-system';

interface ScreenWrapperProps {
 children: React.ReactNode;
 navigation: any;
 showTabBar?: boolean;
}

export const ScreenWrapper = memo<ScreenWrapperProps>(({ 
 children, 
 navigation, 
 showTabBar = true 
}) => {
 const route = useRoute();
 const { userType } = useUserType();

 // Screens that shouldn't show the tab bar
 const hiddenTabScreens = [
  'Auth',
  'CreateWorkout', 
  'CreateTemplate',
  'WorkoutExecution',
  'WorkoutDetail',
  'TemplateDetail',
  'ClientDetails',
  'ExerciseDetail'
 ];

 // Disable bottom tab bar completely
 const shouldShowTabBar = false;

 return (
  <SafeAreaView style={{ 
   flex: 1, 
   backgroundColor: colors.background.primary 
  }} edges={['top']}>
   <View style={{ flex: 1 }}>
    {children}
   </View>
   
   {shouldShowTabBar && (
    <BottomTabBar
     currentRoute={route.name}
     navigation={navigation}
     userType={userType}
    />
   )}
  </SafeAreaView>
 );
});