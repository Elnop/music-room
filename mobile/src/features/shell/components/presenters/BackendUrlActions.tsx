import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Button } from '@/shared/theme/components/Button';
import { DEFAULT_BACKEND_URL } from '@/shared/backend/configs/backendUrlConfig';
import type { BackendUrlFieldState } from '@/features/shell/types/backendUrlFieldTypes';

type BackendUrlActionsProps = {
	field: BackendUrlFieldState;
	onSave: () => void;
	onReset: () => void;
};

export function BackendUrlActions({ field, onSave, onReset }: BackendUrlActionsProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.actions}>
			<Button
				title="Enregistrer"
				onPress={onSave}
				loading={field.isSaving}
				disabled={field.draft.trim() === field.currentUrl}
				style={styles.action}
			/>
			<Button
				title="Rétablir par défaut"
				onPress={onReset}
				variant="outline"
				disabled={field.isSaving || field.currentUrl === DEFAULT_BACKEND_URL}
				style={styles.action}
			/>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		actions: {
			flexDirection: 'row',
			gap: theme.spacing.sm,
		},
		action: {
			flex: 1,
		},
	});
	return styles;
}
