import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { PROFILE_LIMITS, type UpdateProfileInput } from '@/features/profile/types';
import { Input } from '@/shared/components/ui/Input';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { Text } from '@/shared/components/ui/Text';

interface EditProfileFormFieldsProps {
	control: Control<UpdateProfileInput>;
	errors: FieldErrors<UpdateProfileInput>;
	/** Enter in the name field (web); undefined while saving is not possible. */
	onSubmit?: () => void;
}

export function EditProfileFormFields({ control, errors, onSubmit }: EditProfileFormFieldsProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<>
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
							submitOnEnter={onSubmit}
							maxLength={PROFILE_LIMITS.DISPLAY_NAME_MAX}
						/>
						<Text style={styles.charCount}>
							{value?.length || 0}/{PROFILE_LIMITS.DISPLAY_NAME_MAX}
						</Text>
					</View>
				)}
			/>

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

			<Text style={styles.infoText}>
				Remarque : votre nom d'utilisateur et votre email ne peuvent pas être modifiés.
			</Text>
		</>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
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
	});
