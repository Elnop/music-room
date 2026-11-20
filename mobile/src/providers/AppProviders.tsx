import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { AlertHostContainer } from './AlertHostContainer';
import { AppToast } from '@/shared/theme/components/AppToast';
import { ErrorBoundary } from './ErrorBoundary';
import { ThemeProvider } from '@/shared/theme/components/ThemeContext';
import { createQueryClient } from '@/shared/backend/queryClient';
import { onSessionEnd } from '@/shared/backend/lib/authSession';

interface AppProvidersProps {
	children: React.ReactNode;
	queryClient?: QueryClient;
}

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
