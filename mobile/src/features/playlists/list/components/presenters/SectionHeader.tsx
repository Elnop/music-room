import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface SectionHeaderProps {
	icon: keyof typeof Ionicons.glyphMap;
	title: string;
	/** Shown when above 0: after the title, or at the end of a section that does not fold. */
	count: number;
	/** A section that folds: its header toggles it and shows a chevron. */
	open?: boolean;
	onToggle?: () => void;
}

/** The title row of a section of the playlists screen. */
export function SectionHeader({ icon, title, count, open, onToggle }: SectionHeaderProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	const titleRow = (
		<View style={styles.titleRow}>
			<Ionicons name={icon} size={18} color={theme.colors.textSecondary} style={styles.icon} />
			<Text style={styles.title}>{title}</Text>
			{onToggle && count > 0 && <Text style={styles.countInline}>{count}</Text>}
		</View>
	);

	if (!onToggle) {
		return (
			<View style={styles.header}>
				{titleRow}
				{count > 0 && <Text style={styles.count}>{count}</Text>}
			</View>
		);
	}

	return (
		<Pressable style={styles.header} onPress={onToggle} accessibilityLabel={title}>
			{titleRow}
			<Ionicons
				name={open ? 'chevron-down' : 'chevron-forward'}
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
		titleRow: {
			flexDirection: 'row',
			alignItems: 'center',
		},
		icon: {
			marginRight: theme.spacing.sm,
		},
		title: {
			fontSize: theme.typography.sizes.md,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
		},
		count: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
		countInline: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginLeft: theme.spacing.sm,
		},
	});
