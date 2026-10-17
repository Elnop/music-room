import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@contexts/ThemeContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { AppToast } from '@/components/common/AppToast';
import { ThemedSystemUI } from '@/components/common/ThemedSystemUI';
import { configureGoogleSignIn, initializeFacebookSDK } from '@services/oauth';

export default function App() {
	// Configure OAuth providers on app start
	useEffect(() => {
		configureGoogleSignIn();
		initializeFacebookSDK();
	}, []);

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<ErrorBoundary>
				<ThemeProvider>
					<SafeAreaProvider>
						<RootNavigator />
						<ThemedSystemUI />
						<AppToast />
					</SafeAreaProvider>
				</ThemeProvider>
			</ErrorBoundary>
		</GestureHandlerRootView>
	);
}
