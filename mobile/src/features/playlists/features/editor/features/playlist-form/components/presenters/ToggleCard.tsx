import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedSwitch } from '@/shared/theme/components/ThemedSwitch';
import type { Theme } from '@/shared/theme/lib/types';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { Text } from '@/shared/theme/components/Text';

interface ToggleCardProps {
	label: string;
	description: string;
	value: boolean;
	onValueChange: (value: boolean) => void;
}

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

function createStyles(theme: Theme) {
	return StyleSheet.create({
		card: {
			backgroundColor: theme.colors.surface,
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
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
			marginBottom: theme.spacing.xs,
		},
		description: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
	});
}
