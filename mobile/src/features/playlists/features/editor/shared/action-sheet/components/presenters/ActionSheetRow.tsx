import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import AngleRightSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/angle-right-solid.svg';

type ActionSheetRowProps = {
	icon: PixelIconSource;
	label: string;
	onPress: () => void;
	detail?: string;
	destructive?: boolean;
	chevron?: boolean;
};

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
			<PixelIcon icon={icon} size={22} color={color} style={styles.icon} />
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
			{chevron && <PixelIcon icon={AngleRightSolid} size={20} color={theme.colors.textSecondary} />}
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
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
		blockLabel: {
			fontSize: 16,
		},
		detail: {
			fontSize: 13,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
	});
	return styles;
}
