import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { usePlayerHeight } from '@/features/player/context/PlayerContext';
import { useTheme } from '@/shared/theme/ThemeContext';
import { ThemeSelector } from '@/shared/components/theme/ThemeSelector';
import { BackendUrlField } from '@/shared/components/form/BackendUrlField';
import type { Theme } from '@/shared/theme/types';

export function SettingsScreen() {
	const { theme } = useTheme();
	const playerHeight = usePlayerHeight();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<ScrollView
			style={styles.container}
			keyboardShouldPersistTaps="handled"
			contentContainerStyle={{ paddingBottom: playerHeight + theme.spacing.xl }}
		>
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Thème</Text>
				<ThemeSelector />
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Serveur</Text>
				<BackendUrlField />
			</View>
		</ScrollView>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		section: {
			padding: theme.spacing.md,
			borderBottomWidth: theme.borders.thin,
			borderBottomColor: theme.colors.borderLight,
		},
		sectionTitle: {
			fontSize: theme.typography.sizes.xl,
			fontWeight: theme.typography.weights.bold,
			color: theme.colors.text,
			marginBottom: theme.spacing.md,
		},
	});
