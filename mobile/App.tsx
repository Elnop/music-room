import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { AppProviders } from '@/providers/AppProviders';
import { RootNavigator } from '@/navigation/RootNavigator';
import { AppToast } from '@/shared/components/feedback/AppToast';
import { ThemedSystemUI } from '@/shared/components/theme/ThemedSystemUI';
import { configureGoogleSignIn } from '@/features/auth/services/googleSignIn';
import { initializeFacebookSDK } from '@/features/auth/services/facebookSignIn';
import '@/features/auth/hooks/useLinkedProviders';
import { restoreRedirectedPath } from '@/navigation/webBasePath';
import { FONT_ASSETS } from '@/shared/theme/fonts';

// Before the first render: the navigation reads its initial state from the address bar
restoreRedirectedPath();

export default function App() {
	const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);

	useEffect(() => {
		configureGoogleSignIn();
		initializeFacebookSDK();
	}, []);

	// The window background stays up until Inter is ready; a failed load falls back to the system font
	if (!fontsLoaded && !fontError) return null;

	return (
		<AppProviders>
			<RootNavigator />
			<ThemedSystemUI />
			<AppToast />
		</AppProviders>
	);
}
