import React, { useState } from 'react';
import {
	View,
	StyleSheet,
	TextInputProps,
	ViewStyle,
	StyleProp,
	TextStyle,
	Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { focusedFieldStyle } from '@/shared/theme/fieldFocus';
import { useFieldFocus } from '@/shared/hooks/useFieldFocus';
import { Pressable } from './Pressable';
import { Text } from './Text';
import { TextInput } from './TextInput';

interface InputProps extends Omit<TextInputProps, 'style'> {
	label: string;
	error?: string;
	leftIcon?: React.ReactNode;
	containerStyle?: ViewStyle;
	style?: StyleProp<TextStyle>;
	/** Web only: Enter submits the form. Native keyboards keep their return key as it was. */
	submitOnEnter?: () => void;
}

export function Input({
	label,
	value,
	onChangeText,
	placeholder,
	error,
	secureTextEntry,
	autoCapitalize,
	keyboardType,
	leftIcon,
	containerStyle,
	style,
	multiline,
	submitOnEnter,
	onFocus,
	onBlur,
	...rest
}: InputProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const [isHidden, setIsHidden] = useState(true);
	const { focused, focusProps } = useFieldFocus({ onFocus, onBlur });

	return (
		<View style={[styles.container, containerStyle]}>
			<Text style={styles.label}>{label}</Text>
			<View
				style={[
					styles.inputContainer,
					error && styles.inputContainerError,
					focused && focusedFieldStyle(error ? theme.colors.error : theme.colors.primary),
				]}
			>
				{leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
				<TextInput
					style={[
						styles.input,
						leftIcon ? styles.inputWithIcon : undefined,
						secureTextEntry ? styles.inputWithToggle : undefined,
						multiline ? styles.multilineInput : undefined,
						style,
					]}
					value={value}
					onChangeText={onChangeText}
					placeholder={placeholder}
					placeholderTextColor={theme.colors.textSecondary}
					secureTextEntry={secureTextEntry ? isHidden : secureTextEntry}
					autoCapitalize={autoCapitalize}
					keyboardType={keyboardType}
					multiline={multiline}
					{...rest}
					{...focusProps}
					{...(Platform.OS === 'web' && submitOnEnter && !multiline
						? { onSubmitEditing: submitOnEnter }
						: undefined)}
				/>
				{secureTextEntry && (
					<Pressable
						onPress={() => setIsHidden(hidden => !hidden)}
						accessibilityLabel={isHidden ? 'Afficher le mot de passe' : 'Masquer le mot de passe'}
						hitSlop={8}
						style={[styles.toggle, Platform.OS === 'web' && styles.toggleWeb]}
					>
						<Ionicons
							name={isHidden ? 'eye-outline' : 'eye-off-outline'}
							size={20}
							color={theme.colors.textSecondary}
						/>
					</Pressable>
				)}
			</View>
			{error && <Text style={styles.error}>{error}</Text>}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			marginBottom: theme.spacing.md,
		},
		label: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
			marginBottom: theme.spacing.xs,
		},
		inputContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: theme.colors.surface,
			borderRadius: 12,
			borderWidth: 1,
			borderColor: theme.colors.border,
		},
		inputContainerError: {
			borderWidth: 2,
			borderColor: theme.colors.error,
			backgroundColor: theme.colors.surface,
		},
		leftIcon: {
			paddingLeft: theme.spacing.sm + 2,
		},
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
		toggle: {
			paddingHorizontal: theme.spacing.sm + 2,
			paddingVertical: theme.spacing.sm,
		},
		// The keyboard ring sits 4 px outside the button: kept inside the field's frame.
		toggleWeb: {
			paddingHorizontal: theme.spacing.xs,
			paddingVertical: theme.spacing.xs,
			marginHorizontal: theme.spacing.xs + 2,
			borderRadius: 8,
		},
		multilineInput: {
			textAlignVertical: 'top',
			paddingTop: theme.spacing.sm + 2,
		},
		error: {
			fontSize: theme.typography.sizes.xs,
			color: theme.colors.error,
			fontFamily: theme.typography.families.semibold,
			marginTop: theme.spacing.xs,
			marginLeft: theme.spacing.xs,
		},
	});
