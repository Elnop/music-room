import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import type { QueryClient } from '@tanstack/react-query';
import { AlertHostContainer } from '@/features/shell/components/orchestrators/AlertHostContainer';
import { AppToast } from '@/shared/theme/components/AppToast';
import { ErrorBoundary } from '@/features/shell/components/presenters/ErrorBoundary';
import { QueryProvider } from '@/features/shell/components/presenters/QueryProvider';
import { ThemedSystemUi } from '@/features/shell/components/presenters/ThemedSystemUi';
import { ThemeProvider } from '@/features/shell/components/presenters/ThemeProvider';

type AppProvidersProps = {
	children: React.ReactNode;
	queryClient?: QueryClient;
};

export function AppProvidersContainer({ children, queryClient }: AppProvidersProps) {
	return (
		<GestureHandlerRootView style={styles.root}>
			<ErrorBoundary>
				<QueryProvider client={queryClient}>
					<ThemeProvider>
						<SafeAreaProvider>
							{children}
							<ThemedSystemUi />
							<AppToast />
							<AlertHostContainer />
						</SafeAreaProvider>
					</ThemeProvider>
				</QueryProvider>
			</ErrorBoundary>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({ root: { flex: 1 } });
