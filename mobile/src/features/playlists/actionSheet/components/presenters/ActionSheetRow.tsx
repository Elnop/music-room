import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface ActionSheetRowProps {
	icon: keyof typeof Ionicons.glyphMap;
	label: string;
	onPress: () => void;
	/** A second line under the label. */
	detail?: string;
	destructive?: boolean;
	/** Leads to another step of the sheet. */
	chevron?: boolean;
}

export function ActionSheetRow({
	icon,
	label,
	onPress,
	detail,
	destructive = false,
	chevron = false,
}: ActionSheetRowProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const color = destructive ? theme.colors.error : theme.colors.text;

	return (
		<Pressable style={styles.row} onPress={onPress} accessibilityLabel={label}>
			<Ionicons name={icon} size={22} color={color} style={styles.icon} />
			{detail === undefined ? (
				<Text style={[styles.label, { color }]}>{label}</Text>
			) : (
				<View style={styles.textBlock}>
					<Text style={[styles.blockLabel, { color }]} numberOfLines={1}>
						{label}
					</Text>
					<Text style={styles.detail}>{detail}</Text>
				</View>
			)}
			{chevron && <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />}
		</Pressable>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: theme.spacing.lg,
			paddingVertical: 14,
		},
		icon: {
			marginRight: theme.spacing.md,
		},
		textBlock: {
			flex: 1,
		},
		label: {
			flex: 1,
			fontSize: 16,
		},
		// Stacked above the detail: flex: 1 would squash it to nothing in the column.
		blockLabel: {
			fontSize: 16,
		},
		detail: {
			fontSize: 13,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
	});
