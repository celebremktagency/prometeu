import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import * as Font from 'expo-font';
import 'react-native-url-polyfill/auto';
import 'react-native-gesture-handler';

import { AppNavigation } from './src/navigation';
import { lightTheme } from './src/theme/lightTheme';

export default function App() {
  useEffect(() => {
    // Load fonts
    loadFonts();
  }, []);

  const loadFonts = async () => {
    try {
      await Font.loadAsync({
        'Poppins': require('./src/assets/fonts/Poppins-Regular.ttf'),
        'Poppins-Medium': require('./src/assets/fonts/Poppins-Medium.ttf'),
        'Poppins-SemiBold': require('./src/assets/fonts/Poppins-SemiBold.ttf'),
        'Poppins-Bold': require('./src/assets/fonts/Poppins-Bold.ttf'),
      });
    } catch (error) {
      console.warn('Error loading fonts:', error);
      // App will continue with system fonts
    }
  };

  return (
    <>
      <StatusBar 
        style={lightTheme.statusBar}
        backgroundColor={lightTheme.colors.bg}
      />
      <AppNavigation />
    </>
  );
}