import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from '@/navigation/AuthNavigator';
import { AppNavigator } from '@/navigation/AppNavigator';
import { useAuthStore } from '@/store/authStore';
import { useSocketStore } from '@/store/socketStore';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { useMusicControlEmitter } from '@hooks/useMusicControl';
import { loadBackendUrl } from '@/services/backendUrl';

export function RootNavigator() {
	const isAuthenticated = useAuthStore(state => state.isAuthenticated);
	const loadFromStorage = useAuthStore(state => state.loadFromStorage);
	const [isReady, setIsReady] = useState(false);

	const connectSocket = useSocketStore(state => state.connect);
	const disconnectSocket = useSocketStore(state => state.disconnect);

	// Emit listening status and handle remote control commands
	useMusicControlEmitter();

	useEffect(() => {
		// Load the backend address, then the auth state, from AsyncStorage on app
		// start; the address must be known before the first request (token refresh)
		loadBackendUrl()
			.then(() => loadFromStorage())
			.then(async () => {
				// After loading, check if token needs refresh
				const { isAuthenticated, isTokenExpiringSoon, refreshAccessToken } =
					useAuthStore.getState();

				if (isAuthenticated && isTokenExpiringSoon()) {
					console.log('[RootNavigator] Token expired/expiring, refreshing...');
					await refreshAccessToken();
				}
			})
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
			if (__DEV__) console.log('Supabase auth event:', event);

			if (event === 'SIGNED_OUT') {
				useAuthStore.setState({
					user: null,
					accessToken: null,
					refreshToken: null,
					tokenExpiresAt: null,
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
							tokenExpiresAt: session.expires_at ? session.expires_at * 1000 : null,
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
