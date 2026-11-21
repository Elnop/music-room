import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProfileIdentity } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileIdentity';
import { ProfileStatsRow } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileStatsRow';
import { Avatar } from '@/shared/theme/components/Avatar';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { UserProfile } from '@/shared/users/userTypes';
import type { UserStats } from '@/features/user/features/profile/profileTypes';

type ProfileHeaderProps = {
	user: UserProfile;
	stats?: UserStats | null;
};

export function ProfileHeader({ user, stats }: ProfileHeaderProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.heroContent}>
			<Avatar size="lg" name={user.displayName || user.username} uri={user.avatarUrl} />
			<ProfileIdentity user={user} />
			<ProfileStatsRow stats={stats} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		heroContent: {
			alignItems: 'center',
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.lg,
			paddingBottom: theme.spacing.xl,
		},
	});
	return styles;
}
