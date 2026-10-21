import React, { useEffect, useMemo, useState } from 'react';
import {
	DarkTheme,
	DefaultTheme,
	NavigationContainer,
	useNavigationContainerRef,
} from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { AuthNavigator } from '@/navigation/AuthNavigator';
import { AppNavigator, type AppTabsParamList } from '@/navigation/AppNavigator';
import { createLinking, openPendingLink } from '@/navigation/linking';
import { useAuthStore } from '@/store/authStore';
import { useSocketStore } from '@/store/socketStore';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { isDarkBackground } from '@components/common/ConnectionBanner';
import { supabase } from '@/lib/supabase';
import { useMusicControlEmitter } from '@hooks/useMusicControl';
import { loadBackendUrl } from '@/services/backendUrl';
import { logger } from '@/utils/logger';

export function RootNavigator() {
	const isAuthenticated = useAuthStore(state => state.isAuthenticated);
	const loadFromStorage = useAuthStore(state => state.loadFromStorage);
	const [isReady, setIsReady] = useState(false);
	const navigationRef = useNavigationContainerRef<AppTabsParamList>();
	// zumik:// links; read at each link so a link received signed out waits for sign-in
	const linking = useMemo(() => createLinking(() => useAuthStore.getState().isAuthenticated), []);

	// react-navigation's own light default would flash white behind the screens
	// of the dark theme during transitions.
	const { theme } = useTheme();
	const navigationTheme = useMemo(() => {
		const base = isDarkBackground(theme.colors.background) ? DarkTheme : DefaultTheme;
		return {
			...base,
			colors: {
				...base.colors,
				primary: theme.colors.primary,
				background: theme.colors.background,
				card: theme.colors.background,
				text: theme.colors.text,
				border: theme.colors.borderLight,
				notification: theme.colors.primary,
			},
		};
	}, [theme]);

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
					await refreshAccessToken();
				}
			})
			.catch((error: Error) => {
				logger.error('Failed to load auth state:', error);
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

	// A link opened while signed out: the app navigator is mounted once signed in.
	useEffect(() => {
		if (isAuthenticated) openPendingLink(navigationRef);
	}, [isAuthenticated, navigationRef]);

	useEffect(() => {
		// Listen for auth state changes from Supabase
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
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
		return <LoadingSpinner fullScreen message="Chargement…" />;
	}

	return (
		<NavigationContainer ref={navigationRef} linking={linking} theme={navigationTheme}>
			{isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
		</NavigationContainer>
	);
}
