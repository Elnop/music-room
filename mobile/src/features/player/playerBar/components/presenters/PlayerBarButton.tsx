import React from 'react';
import { ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import type { PixelSpriteName } from '@/shared/constants/pixelSprites';
import { Pressable } from '@/shared/components/ui/Pressable';
import { DISABLED_OPACITY } from './playerBarStyles';

interface PlayerBarButtonProps {
	icon: PixelSpriteName;
	label: string;
	onPress: () => void;
	color: string;
	style: StyleProp<ViewStyle>;
	size?: number;
	disabled?: boolean;
	/** Shows a spinner in place of the icon. */
	busy?: boolean;
	/** For a toggle (the device picker while playing elsewhere): announced as selected. */
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
					name={icon}
					size={size}
					color={color}
					style={disabled ? { opacity: DISABLED_OPACITY } : undefined}
				/>
			)}
		</Pressable>
	);
}
