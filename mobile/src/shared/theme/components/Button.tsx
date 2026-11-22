import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { ButtonLook, ButtonSize, ButtonVariant } from '@/shared/theme/types/buttonTypes';
import { ButtonBody } from '@/shared/theme/components/ButtonBody';
import { Pressable } from '@/shared/theme/components/Pressable';
import { keycap } from '@/shared/theme/lib/pixelFrame';

type ButtonLabel = { title: string; children?: never } | { title?: never; children: string };

type ButtonProps = ButtonLabel & {
	onPress: () => void;
	variant?: ButtonVariant;
	size?: ButtonSize;
	disabled?: boolean;
	loading?: boolean;
	fullWidth?: boolean;
	icon?: React.ReactNode;
	style?: ViewStyle;
	accessibilityLabel?: string;
};

export function Button(props: ButtonProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const lookStyles = React.useMemo(() => createLookStyles(theme), [theme]);
	const look = buttonLook(props);
	const label = props.title ?? props.children;

	return (
		<Pressable
			style={[containerStyle(styles, lookStyles, look), props.style]}
			onPress={props.onPress}
			disabled={look.disabled}
			accessibilityLabel={props.accessibilityLabel ?? label}
		>
			<ButtonBody label={label} look={look} icon={props.icon} loading={props.loading} />
		</Pressable>
	);
}

function buttonLook(props: ButtonProps): ButtonLook {
	return {
		variant: props.variant ?? 'primary',
		size: props.size ?? 'default',
		fullWidth: props.fullWidth ?? false,
		disabled: Boolean(props.disabled || props.loading),
	};
}

function containerStyle(
	styles: ReturnType<typeof createStyles>,
	lookStyles: ReturnType<typeof createLookStyles>,
	look: ButtonLook,
): StyleProp<ViewStyle> {
	const variant = {
		primary: lookStyles.primary,
		secondary: lookStyles.secondary,
		outline: lookStyles.outline,
	}[look.variant];
	return [
		styles.container,
		variant,
		look.size === 'compact' && styles.compact,
		look.fullWidth && lookStyles.fullWidth,
		look.disabled && lookStyles.disabled,
	];
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			...keycap(theme),
			height: theme.controls.button,
			paddingHorizontal: theme.spacing.lg,
			alignItems: 'center',
			justifyContent: 'center',
			flexDirection: 'row',
			gap: theme.spacing.sm,
		},
		compact: {
			height: theme.controls.buttonCompact,
			paddingHorizontal: theme.spacing.smd,
			borderBottomWidth: theme.borders.thick,
			gap: theme.spacing.xs,
		},
	});
	return styles;
}

function createLookStyles(theme: Theme) {
	const lookStyles = StyleSheet.create({
		primary: {
			backgroundColor: theme.colors.primary,
		},
		secondary: {
			backgroundColor: theme.colors.surfaceAlt,
		},
		outline: {
			backgroundColor: 'transparent',
			borderColor: theme.colors.text,
		},
		fullWidth: {
			width: '100%',
		},
		disabled: {
			opacity: 0.5,
		},
	});
	return lookStyles;
}
