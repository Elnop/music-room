import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Input } from '@/shared/theme/components/Input';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { CappedField } from '@/shared/theme/types/cappedFieldTypes';
import { Text } from '@/shared/theme/components/Text';

type CappedInputProps = {
	field: CappedField;
	label: string;
	placeholder: string;
	autoFocus?: boolean;
	multiline?: boolean;
	onEnter?: () => void;
};

export function CappedInput({ field, label, ...options }: CappedInputProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View>
			<Input
				{...options}
				label={label}
				value={field.value}
				onChangeText={field.onChangeText}
				error={field.error}
				numberOfLines={options.multiline ? 3 : undefined}
				maxLength={field.max}
				containerStyle={styles.input}
			/>
			<Text style={styles.count}>
				{field.value.length}/{field.max}
			</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		input: {
			marginBottom: theme.spacing.sm,
		},
		count: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			textAlign: 'right',
			marginBottom: theme.spacing.sm,
		},
	});
	return styles;
}
