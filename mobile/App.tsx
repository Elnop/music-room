import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { ThemeProvider } from '@contexts/ThemeContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { configureGoogleSignIn, initializeFacebookSDK } from '@services/oauth';

export default function App() {
  // Configure OAuth providers on app start
  useEffect(() => {
    configureGoogleSignIn();
    initializeFacebookSDK();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ThemeProvider>
          <SafeAreaProvider>
            <RootNavigator />
            <StatusBar style="dark" />
          </SafeAreaProvider>
        </ThemeProvider>
      </ErrorBoundary>
      <Toast />
    </GestureHandlerRootView>
  );
}
