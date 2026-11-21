import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import type { RefreshControlProps } from 'react-native';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';

const LOAD_ERROR = 'Impossible de charger vos appareils';

export function MyDevicesErrorView({
	refreshControl,
}: {
	refreshControl: React.ReactElement<RefreshControlProps>;
}) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	return (
		<ScrollView
			style={styles.errorScreen}
			contentContainerStyle={styles.errorCenter}
			refreshControl={refreshControl}
		>
			<Text style={styles.errorMessage}>{LOAD_ERROR}</Text>
		</ScrollView>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		errorScreen: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		errorCenter: {
			flex: 1,
			alignItems: 'center',
			justifyContent: 'center',
			padding: theme.spacing.lg,
		},
		errorMessage: {
			color: theme.colors.textSecondary,
			fontSize: 16,
			textAlign: 'center',
		},
	});
	return styles;
}
