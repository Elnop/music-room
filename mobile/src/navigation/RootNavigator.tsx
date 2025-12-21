import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { useAuthStore } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { useMusicControlEmitter } from '@hooks/useMusicControl';

export function RootNavigator() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const loadFromStorage = useAuthStore(state => state.loadFromStorage);
  const [isReady, setIsReady] = useState(false);

  const connectSocket = useSocketStore(state => state.connect);
  const disconnectSocket = useSocketStore(state => state.disconnect);

  // Emit listening status and handle remote control commands
  useMusicControlEmitter();

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
    if (isAuthenticated) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, connectSocket, disconnectSocket]);

  useEffect(() => {
    // Listen for auth state changes from Supabase
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Supabase auth event:', event);

      if (event === 'SIGNED_OUT') {
        useAuthStore.setState({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        await useAuthStore.getState().clearStorage();
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
  }, []);

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
