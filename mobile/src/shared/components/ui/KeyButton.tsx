import React from 'react';
import { ActivityIndicator, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import type { PixelIconSource } from '@/shared/components/media/PixelIcon';
import { keycap } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { Pressable } from './Pressable';

/** `device`: a control of where the sound plays. */
type KeyTone = 'primary' | 'surface' | 'device';

interface KeyButtonProps {
	icon: PixelIconSource;
	onPress: () => void;
	accessibilityLabel: string;
	tone?: KeyTone;
	/** The side of a square key; a key with children grows to fit them. */
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
	const ink = {
		primary: theme.colors.onColor,
		surface: theme.colors.text,
		device: theme.colors.info,
	}[tone];

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
			{loading ? (
				<ActivityIndicator color={ink} />
			) : (
				<PixelIcon icon={icon} size={iconSize} color={ink} />
			)}
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
