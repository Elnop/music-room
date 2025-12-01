import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { useAuthStore } from '../store/authStore';
import { LoadingSpinner } from '@components/common';
import { supabase } from '@/lib/supabase';

export function RootNavigator() {
  const { isAuthenticated, loadFromStorage, logout } = useAuthStore();
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

  useEffect(() => {
    // Listen for auth state changes from Supabase
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Supabase auth event:', event);

      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        // User signed out or deleted
        await logout();
      } else if (event === 'TOKEN_REFRESHED') {
        // Token was refreshed, update the access token
        if (session?.access_token) {
          const { user, accessToken } = useAuthStore.getState();
          if (user && accessToken !== session.access_token) {
            // Update token in store
            useAuthStore.setState({
              accessToken: session.access_token,
              refreshToken: session.refresh_token,
            });
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [logout]);

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
