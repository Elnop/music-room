import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	Alert,
	ActivityIndicator,
	type AlertButton,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePlayerHeight } from '@/contexts/PlayerContext';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import type { UpdateProfileData } from '@/types/user.types';
import { useAuthStore } from '@/store/authStore';
import { profileApi } from '@/services/profileApi';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { FormError } from '@/shared/components/feedback/FormError';
import { Avatar } from '@/shared/components/media/Avatar';
import { useAvatarPicker } from '@/hooks/useAvatarPicker';
import { showError } from '@/shared/utils/toast';

// Profile field limits (aligned with backend)
const PROFILE_LIMITS = {
	DISPLAY_NAME_MAX: 15,
	BIO_MAX: 300,
};

// Validation schema (aligned with backend)
const updateProfileSchema = z.object({
	displayName: z
		.string()
		.min(1, 'Le nom ne peut pas être vide')
		.max(PROFILE_LIMITS.DISPLAY_NAME_MAX, `${PROFILE_LIMITS.DISPLAY_NAME_MAX} caractères maximum`),
	bio: z
		.string()
		.max(PROFILE_LIMITS.BIO_MAX, `${PROFILE_LIMITS.BIO_MAX} caractères maximum`)
		.optional()
		.or(z.literal('')),
});

type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export function EditProfileScreen() {
	const { theme } = useTheme();
	const playerHeight = usePlayerHeight();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const navigation = useNavigation<NativeStackNavigationProp<Record<string, undefined>>>();
	const { user, accessToken } = useAuthStore();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { isUploading, pickAndUpload, remove } = useAvatarPicker();

	const openPhotoMenu = () => {
		const buttons: AlertButton[] = [
			{ text: 'Galerie', onPress: () => void pickAndUpload('library') },
			{ text: 'Appareil photo', onPress: () => void pickAndUpload('camera') },
		];
		if (user?.avatarUrl) {
			buttons.push({
				text: 'Retirer la photo',
				style: 'destructive',
				onPress: () => void remove(),
			});
		}
		buttons.push({ text: 'Annuler', style: 'cancel' });
		Alert.alert('Photo de profil', 'Choisissez une nouvelle photo.', buttons);
	};

	const {
		control,
		handleSubmit,
		formState: { errors, isDirty },
	} = useForm<UpdateProfileInput>({
		resolver: zodResolver(updateProfileSchema),
		defaultValues: {
			displayName: user?.displayName || user?.username || '',
			bio: user?.bio || '',
		},
	});

	const onSubmit = async (data: UpdateProfileInput) => {
		if (!accessToken) {
			showError('Non authentifié');
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const updateData: Partial<UpdateProfileData> = {};

			const trimmedDisplayName = data.displayName.trim();
			if (trimmedDisplayName) {
				updateData.displayName = trimmedDisplayName;
			}

			if (data.bio !== undefined) {
				updateData.bio = data.bio.trim();
			}

			const updatedProfile = await profileApi.updateProfile(accessToken, updateData);

			useAuthStore.setState({ user: updatedProfile });

			navigation.goBack();
		} catch (err) {
			const errorMessage = apiErrorMessage(err, 'Impossible de mettre à jour le profil');
			setError(errorMessage);
			showError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<KeyboardAvoidingView
				style={styles.keyboardView}
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

					{/* Profile photo (#351) */}
					<View style={styles.photoBlock}>
						<View>
							<Avatar uri={user?.avatarUrl} name={user?.displayName || user?.username} size="lg" />
							{isUploading && (
								<View style={styles.photoSpinner} testID="avatar-uploading">
									<ActivityIndicator color="#FFFFFF" />
								</View>
							)}
						</View>
						<Button
							variant="outline"
							onPress={openPhotoMenu}
							disabled={isUploading || isLoading}
							style={styles.photoButton}
						>
							Changer la photo
						</Button>
					</View>

					{/* Display Name Input */}
					<Controller
						control={control}
						name="displayName"
						render={({ field: { onChange, onBlur, value } }) => (
							<View>
								<Input
									label="Nom affiché"
									placeholder="Saisissez votre nom"
									value={value}
									onChangeText={text => onChange(text.slice(0, PROFILE_LIMITS.DISPLAY_NAME_MAX))}
									onBlur={onBlur}
									error={errors.displayName?.message}
									autoCapitalize="words"
									returnKeyType="next"
									maxLength={PROFILE_LIMITS.DISPLAY_NAME_MAX}
								/>
								<Text style={styles.charCount}>
									{value?.length || 0}/{PROFILE_LIMITS.DISPLAY_NAME_MAX}
								</Text>
							</View>
						)}
					/>

					{/* Bio Input */}
					<Controller
						control={control}
						name="bio"
						render={({ field: { onChange, onBlur, value } }) => (
							<View>
								<Input
									label="Bio"
									placeholder="Parlez-nous de vous…"
									value={value}
									onChangeText={text => onChange(text.slice(0, PROFILE_LIMITS.BIO_MAX))}
									onBlur={onBlur}
									error={errors.bio?.message}
									multiline
									numberOfLines={4}
									style={styles.bioInput}
									returnKeyType="done"
									maxLength={PROFILE_LIMITS.BIO_MAX}
								/>
								<Text style={styles.charCount}>
									{value?.length || 0}/{PROFILE_LIMITS.BIO_MAX}
								</Text>
							</View>
						)}
					/>

					{/* Info Text */}
					<Text style={styles.infoText}>
						Remarque : votre nom d'utilisateur et votre email ne peuvent pas être modifiés.
					</Text>

					{/* Action Buttons */}
					<View style={styles.actions}>
						<Button
							variant="primary"
							onPress={handleSubmit(onSubmit)}
							loading={isLoading}
							disabled={!isDirty || isLoading}
							style={styles.actionButton}
						>
							Enregistrer
						</Button>

						<Button
							variant="outline"
							onPress={() => navigation.goBack()}
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
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		keyboardView: {
			flex: 1,
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
		photoBlock: {
			alignItems: 'center',
			gap: theme.spacing.md,
			marginBottom: theme.spacing.xl,
		},
		photoSpinner: {
			...StyleSheet.absoluteFillObject,
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: 40,
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
		},
		photoButton: {
			alignSelf: 'center',
		},
		bioInput: {
			minHeight: 100,
			textAlignVertical: 'top',
		},
		charCount: {
			fontSize: 12,
			color: theme.colors.textSecondary,
			textAlign: 'right',
			marginTop: -theme.spacing.sm,
			marginBottom: theme.spacing.sm,
		},
		infoText: {
			fontSize: 12,
			color: theme.colors.textSecondary,
			fontStyle: 'italic',
			marginTop: theme.spacing.md,
			marginBottom: theme.spacing.lg,
		},
		actions: {
			marginTop: theme.spacing.md,
			gap: theme.spacing.md,
		},
		actionButton: {
			marginBottom: theme.spacing.sm,
		},
	});
