import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BackendUrlField } from '@/shared/components/form/BackendUrlField';
import type { Theme } from '@/shared/theme/types';

interface SettingsViewProps {
	theme: Theme;
	bottomPadding: number;
}

export function SettingsView({ theme, bottomPadding }: SettingsViewProps) {
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<ScrollView
			style={styles.container}
			keyboardShouldPersistTaps="handled"
			contentContainerStyle={{ paddingBottom: bottomPadding }}
		>
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
