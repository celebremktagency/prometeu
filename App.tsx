import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-url-polyfill/auto';
import 'react-native-gesture-handler';

import { AppNavigation } from './app/src/navigation';
import { lightTheme } from './app/src/theme/lightTheme';

export default function App() {
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