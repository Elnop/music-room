import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Avatar } from '@/shared/theme/components/Avatar';
import { Button } from '@/shared/theme/components/Button';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import type { Theme } from '@/shared/theme/lib/types';
import type { UserProfile } from '@/shared/users/user.types';

interface EditProfilePhotoProps {
	user: UserProfile | null;
	isUploading: boolean;
	isLoading: boolean;
	onOpenMenu: () => void;
}

export function EditProfilePhoto({
	user,
	isUploading,
	isLoading,
	onOpenMenu,
}: EditProfilePhotoProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={styles.photoBlock}>
			<View>
				<Avatar uri={user?.avatarUrl} name={user?.displayName || user?.username} size="lg" />
				{isUploading && (
					<View style={styles.photoSpinner} testID="avatar-uploading">
						<ActivityIndicator color={theme.colors.textInverse} />
					</View>
				)}
			</View>
			<Button
				variant="outline"
				onPress={onOpenMenu}
				disabled={isUploading || isLoading}
				style={styles.photoButton}
			>
				Changer la photo
			</Button>
		</View>
	);
}

function createStyles(theme: Theme) {
	return StyleSheet.create({
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
}
