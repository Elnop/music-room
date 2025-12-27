import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@contexts/ThemeContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { configureGoogleSignIn, initializeFacebookSDK } from '@services/oauth';
import 'react-native-gesture-handler';

export default function App() {
  // Configure OAuth providers on app start
  useEffect(() => {
    configureGoogleSignIn();
    initializeFacebookSDK();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SafeAreaProvider>
          <RootNavigator />
          <StatusBar style="dark" />
        </SafeAreaProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
