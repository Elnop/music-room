import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { EditProfileBody } from '@/features/user/features/profile/features/edit-profile/components/presenters/EditProfileBody';
import type {
	EditProfileFormState,
	EditProfilePhotoState,
} from '@/features/user/features/profile/features/edit-profile/editProfileTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type EditProfileViewProps = {
	bottomPadding: number;
	photo: EditProfilePhotoState;
	form: EditProfileFormState;
};

export function EditProfileView({ bottomPadding, photo, form }: EditProfileViewProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.root}>
			<KeyboardAvoidingView
				style={styles.root}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
			>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={[styles.contentContainer, bottomPaddingStyle(bottomPadding)]}
					keyboardShouldPersistTaps="handled"
				>
					<EditProfileBody photo={photo} form={form} />
				</ScrollView>
			</KeyboardAvoidingView>
		</View>
	);
}

function bottomPaddingStyle(bottomPadding: number): ViewStyle {
	return { paddingBottom: bottomPadding };
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
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
	});
	return styles;
}
