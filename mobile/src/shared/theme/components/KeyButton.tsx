import React from 'react';
import { StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { KeyGlyph } from '@/shared/theme/components/KeyGlyph';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import { keycap } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { Pressable } from '@/shared/theme/components/Pressable';

type KeyTone = 'primary' | 'surface' | 'device';

type KeyAppearance = {
	tone?: KeyTone;
	size?: number;
	iconSize?: number;
	style?: StyleProp<ViewStyle>;
};

type KeyState = {
	disabled?: boolean;
	loading?: boolean;
};

type KeyButtonProps = {
	icon: PixelIconSource;
	onPress: () => void;
	accessibilityLabel: string;
	appearance?: KeyAppearance;
	state?: KeyState;
	children?: React.ReactNode;
};

export function KeyButton({
	icon,
	onPress,
	accessibilityLabel,
	appearance = {},
	state = {},
	children,
}: KeyButtonProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const ink = keyInk(theme, appearance.tone ?? 'surface');
	const blocked = state.disabled || state.loading;

	return (
		<Pressable
			style={keyStyle(styles, appearance, state.disabled, Boolean(children))}
			onPress={onPress}
			disabled={blocked}
			accessibilityLabel={accessibilityLabel}
			accessibilityState={{ disabled: blocked, busy: state.loading }}
		>
			<KeyGlyph icon={icon} size={appearance.iconSize ?? 24} color={ink} loading={state.loading} />
			{children}
		</Pressable>
	);
}

function keyInk(theme: Theme, tone: KeyTone): string {
	return {
		primary: theme.colors.onColor,
		surface: theme.colors.text,
		device: theme.colors.info,
	}[tone];
}

function keyStyle(
	styles: ReturnType<typeof createStyles>,
	appearance: KeyAppearance,
	disabled: boolean | undefined,
	withLabel: boolean
): StyleProp<ViewStyle> {
	const size = appearance.size ?? 48;
	const tone = { primary: styles.primary, surface: styles.surface, device: styles.device };
	return [
		styles.key,
		tone[appearance.tone ?? 'surface'],
		disabled && styles.disabled,
		withLabel ? { height: size } : { width: size, height: size },
		appearance.style,
	];
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
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
	return styles;
}
