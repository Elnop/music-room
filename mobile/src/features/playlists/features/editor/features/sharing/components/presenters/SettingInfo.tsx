import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconTile } from '@/shared/theme/components/IconTile';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { Text } from '@/shared/theme/components/Text';

type SettingInfoProps = {
	icon: PixelIconSource;
	label: string;
	description: string;
};

export function SettingInfo({ icon, label, description }: SettingInfoProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.info}>
			<IconTile icon={icon} size="row" />
			<View style={styles.text}>
				<Text style={styles.label}>{label}</Text>
				<Text style={styles.description}>{description}</Text>
			</View>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		info: {
			flexDirection: 'row',
			alignItems: 'center',
			flex: 1,
			marginRight: theme.spacing.md,
		},
		text: {
			flex: 1,
		},
		label: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		description: {
			fontSize: theme.typography.sizes.xs,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.xxs,
		},
	});
	return styles;
}
