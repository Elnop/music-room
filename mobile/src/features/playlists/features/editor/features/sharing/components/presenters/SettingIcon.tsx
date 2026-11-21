import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';

type SettingIconProps = {
	icon: PixelIconSource;
};

export function SettingIcon({ icon }: SettingIconProps) {
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
			width: theme.controls.rowIcon,
			height: theme.controls.rowIcon,
			backgroundColor: theme.colors.primary + '15',
			alignItems: 'center',
			justifyContent: 'center',
			marginRight: theme.spacing.md,
		},
	});
	return styles;
}
