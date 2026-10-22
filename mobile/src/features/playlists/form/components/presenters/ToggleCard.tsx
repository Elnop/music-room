import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemedSwitch } from '@/shared/components/ui/ThemedSwitch';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface ToggleCardProps {
	label: string;
	/** What the current value means. */
	description: string;
	value: boolean;
	onValueChange: (value: boolean) => void;
}

/** A setting of the new playlist: its label, what it means now, and a switch. */
export function ToggleCard({ label, description, value, onValueChange }: ToggleCardProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.card}>
			<View style={styles.row}>
				<View style={styles.info}>
					<Text style={styles.label}>{label}</Text>
					<Text style={styles.description}>{description}</Text>
				</View>
				<ThemedSwitch value={value} onValueChange={onValueChange} />
			</View>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		card: {
			backgroundColor: theme.colors.surface,
			borderRadius: theme.spacing.sm,
			padding: theme.spacing.md,
			borderWidth: theme.borders.medium,
			borderColor: theme.colors.border,
		},
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
		},
		info: {
			flex: 1,
			marginRight: theme.spacing.md,
		},
		label: {
			fontSize: theme.typography.sizes.md,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
			marginBottom: theme.spacing.xs,
		},
		description: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
	});
