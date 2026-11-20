import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { AppProvidersContainer } from '@/features/shell/components/orchestrators/AppProvidersContainer';
import { RootNavigator } from '@/app/RootNavigator';
import { ThemedSystemUI } from '@/features/shell/components/presenters/ThemedSystemUI';
import { configureGoogleSignIn } from '@/features/user/features/auth/shared/sign-in/lib/googleSignIn';
import { initializeFacebookSDK } from '@/features/user/features/auth/shared/sign-in/lib/facebookSignIn';
import { restoreRedirectedPath } from '@/features/shell/lib/webBasePath';
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
		<AppProvidersContainer>
			<RootNavigator />
			<ThemedSystemUI />
		</AppProvidersContainer>
	);
}
