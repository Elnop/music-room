import React from 'react';
import { Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { Pressable } from './Pressable';

type ButtonVariant = 'primary' | 'secondary' | 'outline';

/** The label, given either as `title` or as the text children. */
type ButtonLabel = { title: string; children?: never } | { title?: never; children: string };

type ButtonProps = ButtonLabel & {
	onPress: () => void;
	variant?: ButtonVariant;
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
		fullWidth && styles.fullWidth,
		isDisabled && styles.disabled,
		style,
	].filter(Boolean);

	const textStyle = [
		styles.text,
		styles[`${variant}Text` as keyof typeof styles],
		isDisabled && styles.disabledText,
	].filter(Boolean);

	const spinnerColor = variant === 'primary' ? '#FFFFFF' : theme.colors.primary;

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
		container: {
			height: 52,
			paddingHorizontal: 24,
			borderRadius: 12,
			alignItems: 'center',
			justifyContent: 'center',
			flexDirection: 'row',
			gap: 8,
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
			backgroundColor: theme.colors.surface,
			borderWidth: 1,
			borderColor: theme.colors.border,
		},
		outline: {
			backgroundColor: 'transparent',
			borderWidth: 1,
			borderColor: '#FFFFFF',
		},

		text: {
			fontSize: 16,
			fontWeight: '600',
		},
		primaryText: {
			color: '#FFFFFF',
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
