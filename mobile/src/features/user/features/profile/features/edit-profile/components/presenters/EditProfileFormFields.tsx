import React from 'react';
import { StyleSheet } from 'react-native';
import type { Control, FieldErrors } from 'react-hook-form';
import { EditProfileCappedField } from '@/features/user/features/profile/features/edit-profile/components/presenters/EditProfileCappedField';
import {
	BIO_FIELD,
	DISPLAY_NAME_FIELD,
} from '@/features/user/features/profile/features/edit-profile/editProfileConfig';
import type { UpdateProfileInput } from '@/features/user/features/profile/features/edit-profile/editProfileTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';

type EditProfileFormFieldsProps = {
	control: Control<UpdateProfileInput>;
	errors: FieldErrors<UpdateProfileInput>;
	onSubmit?: () => void;
};

export function EditProfileFormFields({ control, errors, onSubmit }: EditProfileFormFieldsProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<>
			<EditProfileCappedField
				control={control}
				name="displayName"
				error={errors.displayName?.message}
				config={{ ...DISPLAY_NAME_FIELD, onEnter: onSubmit }}
			/>

			<EditProfileCappedField
				control={control}
				name="bio"
				error={errors.bio?.message}
				config={BIO_FIELD}
			/>

			<Text style={styles.infoText}>
				Remarque : votre nom d'utilisateur et votre email ne peuvent pas être modifiés.
			</Text>
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		infoText: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			fontStyle: 'italic',
			marginTop: theme.spacing.md,
			marginBottom: theme.spacing.lg,
		},
	});
	return styles;
}
