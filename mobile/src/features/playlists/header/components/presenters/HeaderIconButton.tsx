import React from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useTheme } from '@/shared/theme/ThemeContext';

interface HeaderIconButtonProps {
	icon: keyof typeof Ionicons.glyphMap;
	size: number;
	onPress: () => void;
	accessibilityLabel: string;
}

/** A 36-point icon button of the native header (`headerRight`). */
export function HeaderIconButton({
	icon,
	size,
	onPress,
	accessibilityLabel,
}: HeaderIconButtonProps) {
	const { theme } = useTheme();
	return (
		<Pressable
			onPress={onPress}
			accessibilityLabel={accessibilityLabel}
			style={headerButtonStyles.button}
		>
			<Ionicons name={icon} size={size} color={theme.colors.text} />
		</Pressable>
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
});
