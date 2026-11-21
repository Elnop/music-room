import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { EditProfileFormState } from '@/features/user/features/profile/features/edit-profile/editProfileTypes';
import { Button } from '@/shared/theme/components/Button';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type EditProfileActionsProps = {
	form: EditProfileFormState;
};

export function EditProfileActions({ form }: EditProfileActionsProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.actions}>
			<Button
				variant="primary"
				onPress={form.onSubmit}
				loading={form.isLoading}
				disabled={!form.isDirty || form.isLoading}
				style={styles.actionButton}
				title="Enregistrer"
			/>

			<Button
				variant="outline"
				onPress={form.onCancel}
				disabled={form.isLoading}
				style={styles.actionButton}
				title="Annuler"
			/>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		actions: {
			marginTop: theme.spacing.md,
			gap: theme.spacing.md,
		},
		actionButton: {
			marginBottom: theme.spacing.sm,
		},
	});
	return styles;
}
