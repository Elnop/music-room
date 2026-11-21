import React from 'react';
import { Pressable as NativePressable } from 'react-native';
import type { PressableProps as NativePressableProps, StyleProp, ViewStyle } from 'react-native';
import { useIconTooltip } from '@/shared/theme/hooks/useIconTooltip';
import { pressableStyle } from '@/shared/theme/lib/pressableStyle';
import { withHaptic } from '@/shared/theme/lib/withHaptic';
import type { Haptic } from '@/shared/theme/types/hapticTypes';

type PressState = Parameters<typeof pressableStyle>[1];

type PressableProps = Omit<NativePressableProps, 'style' | 'accessibilityLabel'> & {
	accessibilityLabel: string;
	style?: StyleProp<ViewStyle>;
	haptic?: Haptic;
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
	return (
		<NativePressable
			{...rest}
			ref={tooltipRef}
			disabled={disabled}
			accessibilityRole={accessibilityRole}
			onPress={withHaptic(onPress, haptic)}
			style={(state: PressState) => pressableStyle(style, state, disabled)}
		/>
	);
}
