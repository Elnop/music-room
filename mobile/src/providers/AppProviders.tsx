import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { AlertHost } from '@/shared/components/feedback/AlertHost';
import { ErrorBoundary } from '@/shared/components/feedback/ErrorBoundary';
import { ThemeProvider } from '@/shared/theme/ThemeContext';
import { createQueryClient } from '@/shared/query/queryClient';
import { onSessionEnd } from '@/shared/services/authSession';

interface AppProvidersProps {
	children: React.ReactNode;
	/** Tests pass their own client; the app creates one for its lifetime. */
	queryClient?: QueryClient;
}

/** Every app-wide provider, outermost first. App.tsx renders the app inside it. */
export function AppProviders({ children, queryClient }: AppProvidersProps) {
	const [client] = useState(() => queryClient ?? createQueryClient());

	// Query keys are not per user: the next account must never see the previous one's data.
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
							<AlertHost />
						</SafeAreaProvider>
					</ThemeProvider>
				</QueryClientProvider>
			</ErrorBoundary>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({ root: { flex: 1 } });
