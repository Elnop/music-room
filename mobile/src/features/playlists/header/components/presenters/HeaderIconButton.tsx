import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useTheme } from '@/shared/theme/ThemeContext';
import { INK, PIXEL } from '@/shared/theme/tokens';

interface HeaderIconButtonProps {
	icon: keyof typeof Ionicons.glyphMap;
	size: number;
	onPress: () => void;
	accessibilityLabel: string;
	/** For a button that opens a menu: where the menu drops down from on wide screens. */
	ref?: React.Ref<View>;
}

/** A 36-point pixel-framed icon button of the native header (`headerRight`). */
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
				<Ionicons name={icon} size={size} color={theme.colors.text} />
			</Pressable>
		</View>
	);
}

/** The size of the button, for a placeholder that keeps its place. */
export const headerButtonStyles = StyleSheet.create({
	button: {
		width: 36,
		height: 36,
		alignItems: 'center',
		justifyContent: 'center',
	},
	frame: { borderWidth: PIXEL, borderColor: INK },
});
