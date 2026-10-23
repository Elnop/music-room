import React from 'react';
import { Text, StyleSheet, ScrollView, type RefreshControlProps } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';

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

const createStyles = (theme: Theme) =>
	StyleSheet.create({
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
