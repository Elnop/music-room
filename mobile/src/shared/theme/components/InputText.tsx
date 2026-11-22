import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import { PasswordToggle } from '@/shared/theme/components/PasswordToggle';
import { TextInput } from '@/shared/theme/components/TextInput';
import { useSecureEntry } from '@/shared/theme/hooks/useSecureEntry';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { InputFieldProps } from '@/shared/theme/types/inputTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';

export function InputText({ leftIcon, style, onEnter, ...props }: InputFieldProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const secure = useSecureEntry();

	return (
		<>
			<TextInput
				style={[textStyle(styles, props, Boolean(leftIcon)), style]}
				placeholderTextColor={theme.colors.textSecondary}
				{...props}
				secureTextEntry={props.secureTextEntry && secure.hidden}
				{...webSubmit(onEnter, props.multiline)}
			/>
			{props.secureTextEntry && <PasswordToggle hidden={secure.hidden} onToggle={secure.toggle} />}
		</>
	);
}

function webSubmit(onEnter: (() => void) | undefined, multiline: boolean | undefined) {
	return Platform.OS === 'web' && onEnter && !multiline ? { onSubmitEditing: onEnter } : undefined;
}

function textStyle(
	styles: ReturnType<typeof createStyles>,
	props: InputFieldProps,
	withIcon: boolean,
): StyleProp<TextStyle> {
	return [
		styles.input,
		withIcon ? styles.inputWithIcon : undefined,
		props.secureTextEntry ? styles.inputWithToggle : undefined,
		props.multiline ? styles.multilineInput : undefined,
	];
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		input: {
			flex: 1,
			paddingVertical: theme.spacing.sm + 2,
			paddingHorizontal: theme.spacing.sm + 4,
			fontSize: theme.typography.sizes.md,
			color: theme.colors.text,
			fontFamily: theme.typography.families.regular,
		},
		inputWithIcon: {
			paddingLeft: theme.spacing.xs,
		},
		inputWithToggle: {
			paddingRight: theme.spacing.xs,
		},
		multilineInput: {
			textAlignVertical: 'top',
			paddingTop: theme.spacing.sm + 2,
		},
	});
	return styles;
}
