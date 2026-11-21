import React from 'react';
import { StyleSheet } from 'react-native';
import { EditProfileActions } from '@/features/user/features/profile/features/edit-profile/components/presenters/EditProfileActions';
import { EditProfileFormFields } from '@/features/user/features/profile/features/edit-profile/components/presenters/EditProfileFormFields';
import { EditProfilePhoto } from '@/features/user/features/profile/features/edit-profile/components/presenters/EditProfilePhoto';
import type {
	EditProfileFormState,
	EditProfilePhotoState,
} from '@/features/user/features/profile/features/edit-profile/editProfileTypes';
import { FormError } from '@/shared/theme/components/FormError';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type EditProfileBodyProps = {
	photo: EditProfilePhotoState;
	form: EditProfileFormState;
};

export function EditProfileBody({ photo, form }: EditProfileBodyProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<>
			<Text style={styles.subtitle}>Mettez à jour vos informations</Text>

			{form.error && <FormError message={form.error} />}

			<EditProfilePhoto photo={photo} />

			<EditProfileFormFields
				control={form.control}
				errors={form.errors}
				onSubmit={form.isDirty && !form.isLoading ? form.onSubmit : undefined}
			/>

			<EditProfileActions form={form} />
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		subtitle: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.textSecondary,
			marginBottom: theme.spacing.xl,
		},
	});
	return styles;
}
