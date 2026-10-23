import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Control, FieldErrors } from 'react-hook-form';
import { EditProfileFormFields } from '@/features/profile/editProfile/presenters/EditProfileFormFields';
import { EditProfilePhoto } from '@/features/profile/editProfile/presenters/EditProfilePhoto';
import type { UpdateProfileInput } from '@/features/profile/types';
import { FormError } from '@/shared/components/feedback/FormError';
import { Button } from '@/shared/components/ui/Button';
import type { Theme } from '@/shared/theme/types';
import type { UserProfile } from '@/types/user.types';

interface EditProfileViewProps {
	theme: Theme;
	playerHeight: number;
	user: UserProfile | null;
	error: string | null;
	isUploading: boolean;
	isLoading: boolean;
	isDirty: boolean;
	control: Control<UpdateProfileInput>;
	errors: FieldErrors<UpdateProfileInput>;
	onOpenPhotoMenu: () => void;
	onSubmit: () => void;
	onCancel: () => void;
}

export function EditProfileView({
	theme,
	playerHeight,
	user,
	error,
	isUploading,
	isLoading,
	isDirty,
	control,
	errors,
	onOpenPhotoMenu,
	onSubmit,
	onCancel,
}: EditProfileViewProps) {
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={styles.root}>
			<KeyboardAvoidingView
				style={styles.root}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
			>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={[
						styles.contentContainer,
						{ paddingBottom: playerHeight + theme.spacing.xl },
					]}
					keyboardShouldPersistTaps="handled"
				>
					<Text style={styles.subtitle}>Mettez à jour vos informations</Text>

					{error && <FormError message={error} />}

					<EditProfilePhoto
						user={user}
						isUploading={isUploading}
						isLoading={isLoading}
						onOpenMenu={onOpenPhotoMenu}
					/>

					<EditProfileFormFields control={control} errors={errors} />

					<View style={styles.actions}>
						<Button
							variant="primary"
							onPress={onSubmit}
							loading={isLoading}
							disabled={!isDirty || isLoading}
							style={styles.actionButton}
						>
							Enregistrer
						</Button>

						<Button
							variant="outline"
							onPress={onCancel}
							disabled={isLoading}
							style={styles.actionButton}
						>
							Annuler
						</Button>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		root: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		scrollView: {
			flex: 1,
		},
		contentContainer: {
			padding: theme.spacing.lg,
		},
		subtitle: {
			fontSize: 14,
			color: theme.colors.textSecondary,
			marginBottom: theme.spacing.xl,
		},
		actions: {
			marginTop: theme.spacing.md,
			gap: theme.spacing.md,
		},
		actionButton: {
			marginBottom: theme.spacing.sm,
		},
	});
