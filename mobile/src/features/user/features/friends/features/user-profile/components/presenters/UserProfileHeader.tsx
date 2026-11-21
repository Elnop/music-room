import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { ViewedProfile } from '@/features/user/features/friends/features/user-profile/userProfileTypes';
import { UserProfileInfo } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileInfo';
import { UserProfileActions } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileActions';

type UserProfileHeaderProps = {
	viewed: ViewedProfile;
};

export function UserProfileHeader({ viewed }: UserProfileHeaderProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.header}>
			<UserProfileInfo viewed={viewed} />
			<UserProfileActions viewed={viewed} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		header: {
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.md,
		},
	});
	return styles;
}
