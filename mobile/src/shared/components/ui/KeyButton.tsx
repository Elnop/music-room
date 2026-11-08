import React from 'react';
import { ActivityIndicator, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import type { PixelSpriteName } from '@/shared/constants/pixelSprites';
import { keycap } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { Pressable } from './Pressable';

type KeyTone = 'primary' | 'surface' | 'device';

interface KeyButtonProps {
	icon: PixelSpriteName;
	onPress: () => void;
	accessibilityLabel: string;
	tone?: KeyTone;
	size?: number;
	iconSize?: number;
	disabled?: boolean;
	loading?: boolean;
	children?: React.ReactNode;
	style?: StyleProp<ViewStyle>;
}

export function KeyButton({
	icon,
	onPress,
	accessibilityLabel,
	tone = 'surface',
	size = 48,
	iconSize = 24,
	disabled,
	loading,
	children,
	style,
}: KeyButtonProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const ink = { primary: theme.colors.onColor, surface: theme.colors.text, device: theme.colors.info }[tone];

	return (
		<Pressable
			style={[
				styles.key,
				styles[tone],
				children ? { height: size } : { width: size, height: size },
				disabled && styles.disabled,
				style,
			]}
			onPress={onPress}
			disabled={disabled || loading}
			accessibilityLabel={accessibilityLabel}
			accessibilityState={{ disabled: disabled || loading, busy: loading }}
		>
			{loading ? <ActivityIndicator color={ink} /> : <PixelIcon name={icon} size={iconSize} color={ink} />}
			{children}
		</Pressable>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		key: {
			...keycap(theme),
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			gap: theme.spacing.sm,
		},
		primary: { backgroundColor: theme.colors.primary },
		surface: { backgroundColor: theme.colors.surfaceAlt },
		device: { backgroundColor: theme.colors.surfaceAlt, paddingHorizontal: theme.spacing.md },
		disabled: { opacity: 0.4 },
	});
