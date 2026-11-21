import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from './PixelIcon';
import type { PixelIconSource } from './PixelIcon';
import { Pressable } from './Pressable';
import type { Theme } from '@/shared/theme/lib/types';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { Text } from './Text';
import AngleRightSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/angle-right-solid.svg';
import ChevronDownSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/chevron-down-solid.svg';

interface SectionHeaderProps {
	icon: PixelIconSource;
	title: string;
	count: number;
	open?: boolean;
	onToggle?: () => void;
	action?: React.ReactNode;
}

export function SectionHeader({ icon, title, count, open, onToggle, action }: SectionHeaderProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	const label = (
		<View style={styles.label}>
			<PixelIcon icon={icon} size={18} color={theme.colors.textSecondary} />
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
			<PixelIcon
				icon={open ? ChevronDownSolid : AngleRightSolid}
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
