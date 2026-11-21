import React from 'react';
import { StyleSheet, View } from 'react-native';
import { memberSinceLabel } from '@/features/user/shared/member-since/memberSinceLabel';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';
import type { ViewedProfile } from '@/features/user/features/friends/features/user-profile/userProfileTypes';
import { UserProfileHeader } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileHeader';
import { UserProfilePlaylists } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfilePlaylists';

type UserProfileNarrowBodyProps = {
	viewed: ViewedProfile;
};

export function UserProfileNarrowBody({ viewed }: UserProfileNarrowBodyProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<>
			<UserProfileHeader viewed={viewed} />
			<UserProfilePlaylists playlists={viewed.playlists} ownerName={viewed.profile.username} />
			<View style={styles.infoSection}>
				<Text style={styles.infoText}>
					Membre depuis {memberSinceLabel(viewed.profile.createdAt)}
				</Text>
			</View>
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		infoSection: {
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.lg,
			marginTop: theme.spacing.md,
		},
		infoText: {
			fontSize: theme.typography.sizes.smd,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}
