import React from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-url-polyfill/auto';

import { AppNavigation } from './app/src/navigation';

export default function App() {
  return (
    <>
      <StatusBar 
        style="dark"
        backgroundColor="#F9FAFB"
      />
      <AppNavigation />
    </>
  );
}