import { StyleSheet } from 'react-native';
import type { PressableStateCallbackType, StyleProp, ViewStyle } from 'react-native';
import { HOVERED_OPACITY, PRESSED_OPACITY } from '@/shared/theme/configs/pressableConfig';

type PressState = PressableStateCallbackType & { hovered?: boolean };

export function pressableStyle(
	style: StyleProp<ViewStyle>,
	{ pressed, hovered }: PressState,
	disabled?: boolean | null,
): StyleProp<ViewStyle> {
	return [style, hovered && !pressed && !disabled && styles.hovered, pressed && styles.pressed];
}

const styles = StyleSheet.create({
	pressed: { opacity: PRESSED_OPACITY },
	hovered: { opacity: HOVERED_OPACITY },
});
