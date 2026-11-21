import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';

type MethodBadgeProps = {
	icon: PixelIconSource;
};

export function MethodBadge({ icon }: MethodBadgeProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<View style={styles.methodBadge}>
			<PixelIcon icon={icon} size={20} color={theme.colors.primary} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		methodBadge: {
			width: theme.controls.badge,
			height: theme.controls.badge,
			backgroundColor: theme.colors.primary + '15',
			alignItems: 'center',
			justifyContent: 'center',
			marginRight: theme.spacing.md,
		},
	});
	return styles;
}
