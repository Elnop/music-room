import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { usePlayerHeight } from '@/contexts/PlayerContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeSelector } from '@components/theme/ThemeSelector';
import { BackendUrlField } from '@components/common/BackendUrlField';
import type { Theme } from '@themes/types';

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
				<Text style={styles.sectionTitle}>Appearance</Text>
				<ThemeSelector />
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Server</Text>
				<BackendUrlField />
			</View>

			{/* Future section: Account */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Account</Text>
				<Text style={styles.placeholder}>Account settings coming soon...</Text>
			</View>

			{/* Future section: Notifications */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Notifications</Text>
				<Text style={styles.placeholder}>Notification settings coming soon...</Text>
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
		placeholder: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			fontStyle: 'italic',
		},
	});
