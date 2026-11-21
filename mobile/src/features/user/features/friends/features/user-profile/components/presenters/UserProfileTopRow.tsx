import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar } from '@/shared/theme/components/Avatar';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { FilteredProfile, FollowStatus } from '@/features/user/features/friends/friendsTypes';
import { ProfileStat } from '@/features/user/shared/profile-stat/ProfileStat';

type UserProfileTopRowProps = {
	profile: FilteredProfile;
	followStatus: FollowStatus | null;
};

export function UserProfileTopRow({ profile, followStatus }: UserProfileTopRowProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.topRow}>
			<Avatar size="lg" name={profile.displayName || profile.username} uri={profile.avatarUrl} />
			{followStatus && (
				<View style={styles.statsContainer}>
					<ProfileStat value={followStatus.followersCount} label="Abonnés" variant="visited" />
					<ProfileStat value={followStatus.followingCount} label="Abonnements" variant="visited" />
				</View>
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		topRow: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.lg,
		},
		statsContainer: {
			flex: 1,
			flexDirection: 'row',
			justifyContent: 'space-around',
		},
	});
	return styles;
}
