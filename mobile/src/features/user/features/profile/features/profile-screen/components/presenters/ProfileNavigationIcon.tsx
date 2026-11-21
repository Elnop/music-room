import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';

type ProfileNavigationIconProps = {
	icon: PixelIconSource;
};

export function ProfileNavigationIcon({ icon }: ProfileNavigationIconProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<View style={styles.iconContainer}>
			<PixelIcon icon={icon} size={20} color={theme.colors.primary} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		iconContainer: {
			width: theme.controls.thumbnail,
			height: theme.controls.thumbnail,
			...pixelFrame(theme),
			backgroundColor: theme.colors.background,
			alignItems: 'center',
			justifyContent: 'center',
			marginRight: theme.spacing.md,
		},
	});
	return styles;
}
