import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Input } from '@/shared/theme/components/Input';
import { DEFAULT_BACKEND_URL } from '@/shared/backend/configs/backendUrlConfig';
import { Text } from '@/shared/theme/components/Text';
import { BackendUrlActions } from '@/features/shell/components/presenters/BackendUrlActions';
import type { BackendUrlFieldState } from '@/features/shell/types/backendUrlFieldTypes';

type BackendUrlFieldProps = {
	field: BackendUrlFieldState;
	onChangeDraft: (draft: string) => void;
	onSave: () => void;
	onReset: () => void;
};

export function BackendUrlField({ field, onChangeDraft, onSave, onReset }: BackendUrlFieldProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View>
			<Input
				label="Adresse du serveur"
				value={field.draft}
				onChangeText={onChangeDraft}
				placeholder={DEFAULT_BACKEND_URL}
				error={field.error}
				autoCapitalize="none"
				autoCorrect={false}
				keyboardType="url"
				onSubmitEditing={onSave}
				returnKeyType="done"
			/>
			<Text style={styles.current}>Actuelle : {field.currentUrl}</Text>
			<BackendUrlActions field={field} onSave={onSave} onReset={onReset} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		current: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginBottom: theme.spacing.sm,
		},
	});
	return styles;
}
