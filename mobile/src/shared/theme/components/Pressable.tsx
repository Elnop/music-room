import React from 'react';
import { Pressable as NativePressable, StyleSheet } from 'react-native';
import type {
	GestureResponderEvent,
	PressableProps as NativePressableProps,
	PressableStateCallbackType,
	StyleProp,
	ViewStyle,
} from 'react-native';
import { hapticSelection, hapticSuccess, hapticTap } from '@/shared/theme/lib/haptics';
import { useIconTooltip } from '@/shared/theme/hooks/useIconTooltip';

export const PRESSED_OPACITY = 0.7;

export const HOVERED_OPACITY = 0.85;

type PressState = PressableStateCallbackType & { hovered?: boolean };

export function pressableStyle(
	style: StyleProp<ViewStyle>,
	{ pressed, hovered }: PressState,
	disabled?: boolean | null
): StyleProp<ViewStyle> {
	return [style, hovered && !pressed && !disabled && styles.hovered, pressed && styles.pressed];
}

const HAPTICS = {
	tap: hapticTap,
	selection: hapticSelection,
	success: hapticSuccess,
} as const;

type PressableProps = Omit<NativePressableProps, 'style' | 'accessibilityLabel'> & {
	accessibilityLabel: string;
	style?: StyleProp<ViewStyle>;
	haptic?: keyof typeof HAPTICS;
};

export function Pressable({
	style,
	haptic,
	onPress,
	accessibilityRole = 'button',
	disabled,
	...rest
}: PressableProps) {
	const tooltipRef = useIconTooltip(
		accessibilityRole === 'none' ? undefined : rest.accessibilityLabel
	);
	const handlePress = onPress
		? (event: GestureResponderEvent) => {
				if (haptic) HAPTICS[haptic]();
				onPress(event);
			}
		: undefined;

	return (
		<NativePressable
			{...rest}
			ref={tooltipRef}
			disabled={disabled}
			accessibilityRole={accessibilityRole}
			onPress={handlePress}
			style={(state: PressState) => pressableStyle(style, state, disabled)}
		/>
	);
}

const styles = StyleSheet.create({
	pressed: { opacity: PRESSED_OPACITY },
	hovered: { opacity: HOVERED_OPACITY },
});
