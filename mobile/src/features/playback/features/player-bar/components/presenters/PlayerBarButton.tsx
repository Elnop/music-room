import React from 'react';
import { StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { PlayerBarButtonIcon } from '@/features/playback/features/player-bar/components/presenters/PlayerBarButtonIcon';

type PlayerBarButtonProps = {
	icon: PixelIconSource;
	label: string;
	onPress: () => void;
	appearance?: { color?: string; style?: StyleProp<ViewStyle> };
	state?: { disabled?: boolean; busy?: boolean; selected?: boolean };
};

export function PlayerBarButton({
	icon,
	label,
	onPress,
	appearance = {},
	state = {},
}: PlayerBarButtonProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const disabled = state.disabled ?? false;
	const busy = state.busy ?? false;
	const color = appearance.color ?? (state.selected ? theme.colors.primary : theme.colors.text);

	return (
		<Pressable
			style={[styles.button, appearance.style]}
			onPress={onPress}
			disabled={disabled}
			accessibilityLabel={label}
			accessibilityState={{ disabled, busy, selected: state.selected }}
		>
			<PlayerBarButtonIcon icon={icon} color={color} state={{ disabled, busy }} />
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		button: {
			width: theme.controls.iconButtonLarge,
			height: theme.controls.iconButtonLarge,
			alignItems: 'center',
			justifyContent: 'center',
		},
	});
	return styles;
}
