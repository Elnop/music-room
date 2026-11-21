import React, { useEffect } from 'react';
import { AppProvidersContainer } from '@/features/shell/components/orchestrators/AppProvidersContainer';
import { useAppFontsReady } from '@/features/shell/hooks/useAppFontsReady';
import { startApp } from '@/features/shell/lib/startApp';
import { configureGoogleSignIn } from '@/features/user/features/auth/shared/sign-in/lib/googleSignIn';
import { initializeFacebookSDK } from '@/features/user/features/auth/shared/sign-in/lib/facebookSignIn';
import { RootNavigator } from '@/app/RootNavigator';

startApp();

export function App() {
	const fontsReady = useAppFontsReady();

	useEffect(() => {
		configureGoogleSignIn();
		initializeFacebookSDK();
	}, []);

	if (!fontsReady) return null;

	return (
		<AppProvidersContainer>
			<RootNavigator />
		</AppProvidersContainer>
	);
}
