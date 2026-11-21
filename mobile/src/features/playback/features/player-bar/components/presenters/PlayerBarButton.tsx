import React from 'react';
import { ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { PixelIconSource } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { DISABLED_OPACITY } from './playerBarStyles';

interface PlayerBarButtonProps {
	icon: PixelIconSource;
	label: string;
	onPress: () => void;
	color: string;
	style: StyleProp<ViewStyle>;
	size?: number;
	disabled?: boolean;
	busy?: boolean;
	selected?: boolean;
}

export function PlayerBarButton({
	icon,
	label,
	onPress,
	color,
	style,
	size = 20,
	disabled = false,
	busy = false,
	selected,
}: PlayerBarButtonProps) {
	return (
		<Pressable
			style={style}
			onPress={onPress}
			disabled={disabled}
			accessibilityLabel={label}
			accessibilityState={{ disabled, busy, selected }}
		>
			{busy ? (
				<ActivityIndicator size="small" color={color} />
			) : (
				<PixelIcon
					icon={icon}
					size={size}
					color={color}
					style={disabled ? { opacity: DISABLED_OPACITY } : undefined}
				/>
			)}
		</Pressable>
	);
}
