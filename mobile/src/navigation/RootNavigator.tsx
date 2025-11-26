import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { useAuthStore } from '../store/authStore';
import { LoadingSpinner } from '@components/common';

export function RootNavigator() {
  const { isAuthenticated, loadFromStorage } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Load auth state from AsyncStorage on app start
    loadFromStorage()
      .catch((error: Error) => {
        console.error('Failed to load auth state:', error);
      })
      .finally(() => {
        setIsReady(true);
      });
  }, [loadFromStorage]);

  // Show loading screen while checking auth state
  if (!isReady) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
