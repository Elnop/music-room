import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { Input } from '@/shared/theme/components/Input';
import type { Theme } from '@/shared/theme/lib/types';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { CappedField } from '@/shared/theme/hooks/useCappedField';
import { Text } from '@/shared/theme/components/Text';

interface CappedInputProps {
	field: CappedField;
	label: string;
	placeholder: string;
	autoFocus?: boolean;
	multiline?: boolean;
	keyboardType?: TextInputProps['keyboardType'];
	submitOnEnter?: () => void;
}

export function CappedInput({
	field,
	label,
	placeholder,
	autoFocus,
	multiline,
	keyboardType,
	submitOnEnter,
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
				submitOnEnter={submitOnEnter}
			/>
			<Text style={styles.count}>
				{field.value.length}/{field.max}
			</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	return StyleSheet.create({
		count: {
			fontSize: 12,
			color: theme.colors.textSecondary,
			textAlign: 'right',
			marginTop: -theme.spacing.sm,
			marginBottom: theme.spacing.sm,
		},
	});
}
