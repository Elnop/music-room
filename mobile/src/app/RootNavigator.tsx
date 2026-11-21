import React, { useEffect, useMemo } from 'react';
import { useNavigationContainerRef } from '@react-navigation/native';
import { AuthNavigator } from '@/app/AuthNavigator';
import { AppNavigator } from '@/app/AppNavigator';
import type { AppTabsParamList } from '@/app/AppNavigator';
import { useAuthStore } from '@/features/user/features/auth/shared/sign-in/authStore';
import { useMusicControlEmitter } from '@/features/playback/features/control-delegation/hooks/useMusicControlEmitter';
import { createLinking, openPendingLink } from '@/features/shell/lib/linking';
import { NavigationRootLayout } from '@/features/shell/components/orchestrators/NavigationRootLayout';
import { useAppStartup } from '@/features/shell/hooks/useAppStartup';
import { useSocketConnection } from '@/features/shell/hooks/useSocketConnection';

function isSignedIn(): boolean {
	return useAuthStore.getState().isAuthenticated;
}

async function loadSession(): Promise<void> {
	await useAuthStore.getState().loadFromStorage();
	const { isAuthenticated, isTokenExpiringSoon, refreshAccessToken } = useAuthStore.getState();
	if (isAuthenticated && isTokenExpiringSoon()) {
		await refreshAccessToken();
	}
}

export function RootNavigator() {
	const isAuthenticated = useAuthStore(state => state.isAuthenticated);
	const navigationRef = useNavigationContainerRef<AppTabsParamList>();
	const linking = useMemo(() => createLinking(isSignedIn), []);
	const ready = useAppStartup(loadSession);
	useSocketConnection(isAuthenticated);
	useMusicControlEmitter();

	useEffect(() => {
		if (isAuthenticated) openPendingLink(navigationRef);
	}, [isAuthenticated, navigationRef]);

	return (
		<NavigationRootLayout ready={ready} linking={linking} navigationRef={navigationRef}>
			{isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
		</NavigationRootLayout>
	);
}
