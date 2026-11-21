import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type HeaderIconButtonProps = {
	icon: PixelIconSource;
	size: number;
	onPress: () => void;
	accessibilityLabel: string;
	ref?: React.Ref<View>;
};

export function HeaderIconButton({
	icon,
	size,
	onPress,
	accessibilityLabel,
	ref,
}: HeaderIconButtonProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	return (
		<View ref={ref} collapsable={false}>
			<Pressable onPress={onPress} accessibilityLabel={accessibilityLabel} style={styles.button}>
				<PixelIcon icon={icon} size={size} color={theme.colors.text} />
			</Pressable>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		button: {
			width: theme.controls.headerButton,
			height: theme.controls.headerButton,
			alignItems: 'center',
			justifyContent: 'center',
			borderWidth: theme.borders.thin,
			borderColor: theme.colors.border,
			backgroundColor: theme.colors.background,
		},
	});
	return styles;
}
