import React from 'react';
import type { ViewStyle } from 'react-native';
import { View, StyleSheet } from 'react-native';
import { InputFrame } from '@/shared/theme/components/InputFrame';
import { InputText } from '@/shared/theme/components/InputText';
import { Text } from '@/shared/theme/components/Text';
import { useFieldFocus } from '@/shared/theme/hooks/useFieldFocus';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { InputFieldProps } from '@/shared/theme/types/inputTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';

type InputProps = InputFieldProps & {
	label: string;
	error?: string;
	containerStyle?: ViewStyle;
};

export function Input({ label, error, containerStyle, onFocus, onBlur, ...field }: InputProps) {
	const { styles } = useThemedStyles(createStyles);
	const { focused, focusProps } = useFieldFocus({ onFocus, onBlur });

	return (
		<View style={[styles.container, containerStyle]}>
			<Text style={styles.label}>{label}</Text>
			<InputFrame error={error} focused={focused} leftIcon={field.leftIcon}>
				<InputText {...field} {...focusProps} />
			</InputFrame>
			{error && <Text style={styles.error}>{error}</Text>}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			marginBottom: theme.spacing.md,
		},
		label: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
			marginBottom: theme.spacing.xs,
		},
		error: {
			fontSize: theme.typography.sizes.xs,
			color: theme.colors.error,
			fontFamily: theme.typography.families.semibold,
			marginTop: theme.spacing.xs,
			marginLeft: theme.spacing.xs,
		},
	});
	return styles;
}
