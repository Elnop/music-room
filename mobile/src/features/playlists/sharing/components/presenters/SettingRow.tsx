import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { ThemedSwitch } from '@/shared/components/ui/ThemedSwitch';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { createSharingStyles } from './sharingStyles';

interface SettingRowProps {
	icon: keyof typeof Ionicons.glyphMap;
	label: string;
	description: string;
	value: boolean;
	onToggle: () => void;
	/** A change is on its way: a spinner replaces the switch. */
	busy: boolean;
}

/** One switch of the playlist's settings, with its icon and what it means now. */
export function SettingRow({ icon, label, description, value, onToggle, busy }: SettingRowProps) {
	const { styles: shared } = useThemedStyles(createSharingStyles);
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<View style={[shared.card, shared.row, styles.item]}>
			<View style={styles.info}>
				<View style={styles.iconContainer}>
					<Ionicons name={icon} size={20} color={theme.colors.primary} />
				</View>
				<View style={styles.text}>
					<Text style={styles.label}>{label}</Text>
					<Text style={styles.description}>{description}</Text>
				</View>
			</View>
			{busy ? (
				<LoadingSpinner size="small" />
			) : (
				<ThemedSwitch value={value} onValueChange={onToggle} />
			)}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		item: {
			justifyContent: 'space-between',
		},
		info: {
			flexDirection: 'row',
			alignItems: 'center',
			flex: 1,
			marginRight: theme.spacing.md,
		},
		iconContainer: {
			width: 36,
			height: 36,
			borderRadius: 18,
			backgroundColor: theme.colors.primary + '15',
			alignItems: 'center',
			justifyContent: 'center',
			marginRight: theme.spacing.md,
		},
		text: {
			flex: 1,
		},
		label: {
			fontSize: theme.typography.sizes.md,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
		},
		description: {
			fontSize: theme.typography.sizes.xs,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
	});
