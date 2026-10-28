import React from 'react';
import { StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { Pressable } from './Pressable';
import { Text } from './Text';
import { FONT_FAMILIES } from '@/shared/theme/fonts';

type ButtonVariant = 'primary' | 'secondary' | 'outline';
/** `compact` fits a header row, next to a title. */
type ButtonSize = 'default' | 'compact';

/** The label, given either as `title` or as the text children. */
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
	/** Defaults to the label. */
	accessibilityLabel?: string;
};

export function Button({
	title,
	children,
	onPress,
	variant = 'primary',
	size = 'default',
	disabled = false,
	loading = false,
	fullWidth = false,
	icon,
	style,
	accessibilityLabel,
}: ButtonProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const isDisabled = disabled || loading;
	const buttonText = title ?? children;

	const containerStyle = [
		styles.container,
		styles[variant],
		size === 'compact' && styles.compact,
		fullWidth && styles.fullWidth,
		isDisabled && styles.disabled,
		style,
	].filter(Boolean);

	const textStyle = [
		styles.text,
		styles[`${variant}Text` as keyof typeof styles],
		size === 'compact' && styles.compactText,
		isDisabled && styles.disabledText,
	].filter(Boolean);

	const spinnerColor = variant === 'primary' ? theme.colors.onColor : theme.colors.primary;

	return (
		<Pressable
			style={containerStyle}
			onPress={onPress}
			disabled={isDisabled}
			accessibilityLabel={accessibilityLabel ?? buttonText}
		>
			{loading ? (
				<ActivityIndicator color={spinnerColor} size="small" />
			) : (
				<>
					{icon}
					<Text style={textStyle}>{buttonText}</Text>
				</>
			)}
		</Pressable>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		// A keyboard key: a pixel outline whose thick bottom edge reads as depth.
		container: {
			height: 52,
			paddingHorizontal: 24,
			borderWidth: theme.borders.thick,
			borderBottomWidth: theme.borders.thick * 3,
			borderColor: theme.colors.border,
			alignItems: 'center',
			justifyContent: 'center',
			flexDirection: 'row',
			gap: 8,
		},
		compact: {
			height: 28,
			paddingHorizontal: 12,
			borderBottomWidth: theme.borders.thick,
			gap: 4,
		},
		fullWidth: {
			width: '100%',
		},
		disabled: {
			opacity: 0.5,
		},

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

		text: {
			fontSize: 16,
			fontFamily: FONT_FAMILIES.semibold,
		},
		compactText: {
			fontSize: 13,
		},
		primaryText: {
			color: theme.colors.onColor,
		},
		secondaryText: {
			color: theme.colors.text,
		},
		outlineText: {
			color: theme.colors.text,
		},
		disabledText: {
			opacity: 0.7,
		},
	});
