import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { Text } from '@/shared/components/ui/Text';

interface SectionHeaderProps {
	icon: keyof typeof Ionicons.glyphMap;
	/** Read by screen readers; on screen the icon and the count stand for it. */
	title: string;
	/** Shown when above 0. */
	count: number;
	/** A section that folds: its header toggles it and shows a chevron. */
	open?: boolean;
	onToggle?: () => void;
	/** A control at the end of a section that does not fold, such as a compact button. */
	action?: React.ReactNode;
}

export function SectionHeader({ icon, title, count, open, onToggle, action }: SectionHeaderProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	const label = (
		<View style={styles.label}>
			<Ionicons name={icon} size={18} color={theme.colors.textSecondary} />
			{count > 0 && <Text style={styles.count}>{count}</Text>}
		</View>
	);

	if (!onToggle) {
		return (
			<View style={styles.header} accessible accessibilityRole="header" accessibilityLabel={title}>
				{label}
				{action}
			</View>
		);
	}

	return (
		<Pressable style={styles.header} onPress={onToggle} accessibilityLabel={title}>
			{label}
			<Ionicons
				name={open ? 'chevron-down-sharp' : 'chevron-forward-sharp'}
				size={20}
				color={theme.colors.textSecondary}
			/>
		</Pressable>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		header: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingHorizontal: theme.spacing.md,
			marginBottom: theme.spacing.md,
		},
		label: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
		count: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.mono,
			color: theme.colors.textSecondary,
		},
	});
