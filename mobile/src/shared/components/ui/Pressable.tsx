import React from 'react';
import {
	Pressable as NativePressable,
	StyleSheet,
	type GestureResponderEvent,
	type PressableProps as NativePressableProps,
	type PressableStateCallbackType,
	type StyleProp,
	type ViewStyle,
} from 'react-native';
import { hapticSelection, hapticSuccess, hapticTap } from '@/shared/utils/haptics';
import { useIconTooltip } from '@/shared/hooks/useIconTooltip';

export const PRESSED_OPACITY = 0.7;

export const HOVERED_OPACITY = 0.85;

type PressState = PressableStateCallbackType & { hovered?: boolean };

export const pressableStyle = (
	style: StyleProp<ViewStyle>,
	{ pressed, hovered }: PressState,
	disabled?: boolean | null
): StyleProp<ViewStyle> => [
	style,
	hovered && !pressed && !disabled && styles.hovered,
	pressed && styles.pressed,
];

const HAPTICS = {
	tap: hapticTap,
	selection: hapticSelection,
	success: hapticSuccess,
} as const;

interface PressableProps extends Omit<NativePressableProps, 'style' | 'accessibilityLabel'> {
	accessibilityLabel: string;
	style?: StyleProp<ViewStyle>;
	haptic?: keyof typeof HAPTICS;
}

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
