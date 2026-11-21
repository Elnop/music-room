import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { PixelIconSource } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import { INK, PIXEL } from '@/shared/theme/lib/tokens';

interface HeaderIconButtonProps {
	icon: PixelIconSource;
	size: number;
	onPress: () => void;
	accessibilityLabel: string;
	ref?: React.Ref<View>;
}

export function HeaderIconButton({
	icon,
	size,
	onPress,
	accessibilityLabel,
	ref,
}: HeaderIconButtonProps) {
	const { theme } = useTheme();
	return (
		<View ref={ref} collapsable={false}>
			<Pressable
				onPress={onPress}
				accessibilityLabel={accessibilityLabel}
				style={[
					headerButtonStyles.button,
					headerButtonStyles.frame,
					{ backgroundColor: theme.colors.background },
				]}
			>
				<PixelIcon icon={icon} size={size} color={theme.colors.text} />
			</Pressable>
		</View>
	);
}

export const headerButtonStyles = StyleSheet.create({
	button: {
		width: 36,
		height: 36,
		alignItems: 'center',
		justifyContent: 'center',
	},
	frame: { borderWidth: PIXEL, borderColor: INK },
});
