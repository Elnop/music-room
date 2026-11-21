import React from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { ButtonLook } from '@/shared/theme/types/buttonTypes';
import { Text } from '@/shared/theme/components/Text';
import { displayText } from '@/shared/theme/lib/pixelFrame';

type ButtonBodyProps = {
	label: string;
	look: ButtonLook;
	icon?: React.ReactNode;
	loading?: boolean;
};

export function ButtonBody({ label, look, icon, loading }: ButtonBodyProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const spinnerColor = look.variant === 'primary' ? theme.colors.onColor : theme.colors.primary;

	if (loading) return <ActivityIndicator color={spinnerColor} size="small" />;
	return (
		<>
			{icon}
			<Text style={labelStyle(styles, look)}>{label}</Text>
		</>
	);
}

function labelStyle(
	styles: ReturnType<typeof createStyles>,
	look: ButtonLook
): StyleProp<TextStyle> {
	const variant = {
		primary: styles.primaryText,
		secondary: styles.secondaryText,
		outline: styles.outlineText,
	}[look.variant];
	return [
		styles.text,
		variant,
		look.size === 'compact' && styles.compactText,
		look.disabled && styles.disabledText,
	];
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		text: {
			...displayText(theme, 16, 'button'),
			textTransform: 'uppercase',
		},
		compactText: {
			fontSize: displayText(theme, 13, 'button').fontSize,
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
	return styles;
}
