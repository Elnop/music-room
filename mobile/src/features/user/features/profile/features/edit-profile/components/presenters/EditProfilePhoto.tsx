import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { EditProfilePhotoState } from '@/features/user/features/profile/features/edit-profile/editProfileTypes';
import { Avatar } from '@/shared/theme/components/Avatar';
import { Button } from '@/shared/theme/components/Button';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type EditProfilePhotoProps = {
	photo: EditProfilePhotoState;
};

export function EditProfilePhoto({ photo }: EditProfilePhotoProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const { user } = photo;

	return (
		<View style={styles.photoBlock}>
			<View>
				<Avatar uri={user?.avatarUrl} name={user?.displayName || user?.username} size="lg" />
				{photo.isUploading && (
					<View style={styles.photoSpinner} testID="avatar-uploading">
						<ActivityIndicator color={theme.colors.textInverse} />
					</View>
				)}
			</View>
			<Button
				variant="outline"
				onPress={photo.onOpenMenu}
				disabled={photo.isUploading || photo.isLoading}
				style={styles.photoButton}
				title="Changer la photo"
			/>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		photoBlock: {
			alignItems: 'center',
			gap: theme.spacing.md,
			marginBottom: theme.spacing.xl,
		},
		photoSpinner: {
			...StyleSheet.absoluteFillObject,
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: theme.colors.backdrop,
		},
		photoButton: {
			alignSelf: 'center',
		},
	});
	return styles;
}
