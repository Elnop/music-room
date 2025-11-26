import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation';
import 'react-native-gesture-handler';

export default function App() {
  return (
    <>
      <RootNavigator />
      <StatusBar style="light" />
    </>
  );
}
