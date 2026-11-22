import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { AlertHostContainer } from '@/features/shell/components/orchestrators/AlertHostContainer';
import { AppToast } from '@/shared/theme/components/AppToast';
import { ErrorBoundary } from '@/features/shell/components/presenters/ErrorBoundary';
import { ThemedSystemUi } from '@/features/shell/components/presenters/ThemedSystemUi';
import { ThemeProvider } from '@/features/shell/components/presenters/ThemeProvider';
import { createQueryClient } from '@/shared/backend/createQueryClient';
import { onSessionEnd } from '@/shared/backend/lib/sessionEnd';

type AppProvidersProps = {
	children: React.ReactNode;
	queryClient?: QueryClient;
};

export function AppProvidersContainer({ children, queryClient }: AppProvidersProps) {
	const [client] = useState(() => queryClient ?? createQueryClient());

	useEffect(() => {
		const unsubscribe = onSessionEnd(() => client.clear());
		return () => {
			unsubscribe();
		};
	}, [client]);

	return (
		<GestureHandlerRootView style={styles.root}>
			<ErrorBoundary>
				<QueryClientProvider client={client}>
					<ThemeProvider>
						<SafeAreaProvider>
							{children}
							<ThemedSystemUi />
							<AppToast />
							<AlertHostContainer />
						</SafeAreaProvider>
					</ThemeProvider>
				</QueryClientProvider>
			</ErrorBoundary>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({ root: { flex: 1 } });
