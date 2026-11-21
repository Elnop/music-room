import React from 'react';
import { StyleSheet } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';

type EmptyStateIconProps = {
	icon: PixelIconSource;
	compact: boolean;
};

export function EmptyStateIcon({ icon, compact }: EmptyStateIconProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	return (
		<PixelIcon
			icon={icon}
			size={compact ? 36 : 60}
			color={theme.colors.textSecondary}
			style={[styles.icon, compact && styles.compactIcon]}
		/>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		compactIcon: {
			marginBottom: theme.spacing.sm,
		},
		icon: {
			marginBottom: theme.spacing.md,
			opacity: 0.6,
		},
	});
	return styles;
}
