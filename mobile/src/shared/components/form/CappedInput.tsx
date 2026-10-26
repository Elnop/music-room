import React from 'react';
import { StyleSheet, Text, View, type TextInputProps } from 'react-native';
import { Input } from '@/shared/components/ui/Input';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { CappedField } from '@/shared/hooks/useCappedField';

interface CappedInputProps {
	field: CappedField;
	label: string;
	placeholder: string;
	autoFocus?: boolean;
	multiline?: boolean;
	keyboardType?: TextInputProps['keyboardType'];
}

export function CappedInput({
	field,
	label,
	placeholder,
	autoFocus,
	multiline,
	keyboardType,
}: CappedInputProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View>
			<Input
				label={label}
				value={field.value}
				onChangeText={field.onChangeText}
				placeholder={placeholder}
				error={field.error}
				autoFocus={autoFocus}
				multiline={multiline}
				numberOfLines={multiline ? 3 : undefined}
				maxLength={field.max}
				keyboardType={keyboardType}
			/>
			<Text style={styles.count}>
				{field.value.length}/{field.max}
			</Text>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		count: {
			fontSize: 12,
			color: theme.colors.textSecondary,
			textAlign: 'right',
			marginTop: -theme.spacing.sm,
			marginBottom: theme.spacing.sm,
		},
	});
