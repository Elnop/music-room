import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { focusedFieldStyle } from '@/shared/theme/lib/focusedFieldStyle';
import type { Theme } from '@/shared/theme/types/themeTypes';

type InputFrameProps = {
	error?: string;
	focused: boolean;
	leftIcon?: React.ReactNode;
	children: React.ReactNode;
};

export function InputFrame({ error, focused, leftIcon, children }: InputFrameProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const focusColor = error ? theme.colors.error : theme.colors.primary;

	return (
		<View
			style={[
				styles.inputContainer,
				error && styles.inputContainerError,
				focused && focusedFieldStyle(focusColor),
			]}
		>
			{leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
			{children}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		inputContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: theme.colors.surface,
			borderWidth: theme.borders.thick,
			borderColor: theme.colors.border,
		},
		inputContainerError: {
			borderColor: theme.colors.error,
			backgroundColor: theme.colors.surface,
		},
		leftIcon: {
			paddingLeft: theme.spacing.sm + 2,
		},
	});
	return styles;
}
