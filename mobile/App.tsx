import React, { useEffect } from 'react';
import { AppProviders } from '@/providers/AppProviders';
import { RootNavigator } from '@/navigation/RootNavigator';
import { AppToast } from '@/shared/components/feedback/AppToast';
import { ThemedSystemUI } from '@/shared/components/theme/ThemedSystemUI';
import { configureGoogleSignIn } from '@/features/auth/services/googleSignIn';
import { initializeFacebookSDK } from '@/features/auth/services/facebookSignIn';
import '@/features/auth/hooks/useLinkedProviders';

export default function App() {
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
