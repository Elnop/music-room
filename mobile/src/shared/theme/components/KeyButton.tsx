import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { PixelIconSource } from '@/shared/theme/components/PixelIcon';
import { keycap } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/lib/types';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { Pressable } from '@/shared/theme/components/Pressable';

type KeyTone = 'primary' | 'surface' | 'device';

interface KeyButtonProps {
	icon: PixelIconSource;
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

function createStyles(theme: Theme) {
	return StyleSheet.create({
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
}
