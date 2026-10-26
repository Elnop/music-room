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

/** The opacity of every pressable element while it is held down. */
export const PRESSED_OPACITY = 0.7;

/** Under a mouse pointer (web); the browser already shows the hand cursor on an enabled pressable. */
export const HOVERED_OPACITY = 0.85;

/** react-native-web adds the pointer state; native platforms never set it. */
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
	/** What a screen reader announces; required so no control is silent. */
	accessibilityLabel: string;
	style?: StyleProp<ViewStyle>;
	/** Haptic feedback fired on press; none by default. */
	haptic?: keyof typeof HAPTICS;
}

/** The app's only touchable primitive; gestures (swipe, drag) stay on react-native-gesture-handler. */
export function Pressable({
	style,
	haptic,
	onPress,
	accessibilityRole = 'button',
	disabled,
	...rest
}: PressableProps) {
	const handlePress = onPress
		? (event: GestureResponderEvent) => {
				if (haptic) HAPTICS[haptic]();
				onPress(event);
			}
		: undefined;

	return (
		<NativePressable
			{...rest}
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
