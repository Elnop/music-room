import React, { useEffect } from 'react';
import { AppProviders } from '@/providers/AppProviders';
import { RootNavigator } from '@/navigation/RootNavigator';
import { AppToast } from '@/shared/components/feedback/AppToast';
import { ThemedSystemUI } from '@/shared/components/theme/ThemedSystemUI';
import { configureGoogleSignIn, initializeFacebookSDK } from '@/services/oauth';

export default function App() {
	// Configure OAuth providers on app start
	useEffect(() => {
		configureGoogleSignIn();
		initializeFacebookSDK();
	}, []);

	return (
		<AppProviders>
			<RootNavigator />
			<ThemedSystemUI />
			<AppToast />
		</AppProviders>
	);
}
