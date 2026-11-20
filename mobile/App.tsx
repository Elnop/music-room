import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { AppProviders } from '@/providers/AppProviders';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ThemedSystemUI } from '@/shared/theme/components/ThemedSystemUI';
import { configureGoogleSignIn } from '@/features/auth/services/googleSignIn';
import { initializeFacebookSDK } from '@/features/auth/services/facebookSignIn';
// Registers the linked accounts bridge.
import '@/features/auth/hooks/useLinkedProviders';
import { restoreRedirectedPath } from '@/navigation/webBasePath';
import { onBackendError } from '@/shared/backend/lib/backendErrors';
import { logger } from '@/shared/logging/logger';
import { FONT_ASSETS } from '@/shared/theme/lib/fonts';

// Before the first render: navigation reads its initial state from the address bar.
onBackendError((level, message, context) => logger[level](message, context));
restoreRedirectedPath();

export default function App() {
	const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);

	useEffect(() => {
		configureGoogleSignIn();
		initializeFacebookSDK();
	}, []);

	// A failed font load falls back to the system font.
	if (!fontsLoaded && !fontError) return null;

	return (
		<AppProviders>
			<RootNavigator />
			<ThemedSystemUI />
		</AppProviders>
	);
}
