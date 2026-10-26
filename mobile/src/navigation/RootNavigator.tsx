import React, { useEffect, useMemo, useState } from 'react';
import {
	DarkTheme,
	DefaultTheme,
	NavigationContainer,
	useNavigationContainerRef,
} from '@react-navigation/native';
import { useTheme } from '@/shared/theme/ThemeContext';
import { NAVIGATION_FONTS } from '@/shared/theme/navigationFonts';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator, type AppTabsParamList } from './AppNavigator';
import { createLinking, openPendingLink } from './linking';
import { formatDocumentTitle } from './documentTitle';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useSocketStore } from '@/shared/stores/socketStore';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { isDarkBackground } from '@/shared/components/feedback/ConnectionBanner';
import { useMusicControlEmitter } from '@/features/music-control/hooks/useMusicControlEmitter';
import { loadBackendUrl } from '@/shared/services/backendUrl';
import { logger } from '@/shared/utils/logger';

const DOCUMENT_TITLE = { formatter: formatDocumentTitle };

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
			fonts: NAVIGATION_FONTS,
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

	useMusicControlEmitter();

	useEffect(() => {
		// The backend address must be known before the first request (token refresh)
		loadBackendUrl()
			.then(() => loadFromStorage())
			.then(async () => {
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

	if (!isReady) {
		return <LoadingSpinner fullScreen message="Chargement…" />;
	}

	return (
		<NavigationContainer
			ref={navigationRef}
			linking={linking}
			theme={navigationTheme}
			documentTitle={DOCUMENT_TITLE}
		>
			{isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
		</NavigationContainer>
	);
}
