import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';
import type { ViewedProfile } from '@/features/user/features/friends/features/user-profile/userProfileTypes';
import { FollowBackHint } from '@/features/user/features/friends/features/user-profile/components/presenters/FollowBackHint';
import { UserProfileBadges } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileBadges';

type UserProfileNamesProps = {
	viewed: ViewedProfile;
};

export function UserProfileNames({ viewed }: UserProfileNamesProps) {
	const { styles } = useThemedStyles(createStyles);
	const { profile, follow } = viewed;

	return (
		<View style={styles.nameSection}>
			<View style={styles.usernameRow}>
				<Text style={styles.username}>{profile.username}</Text>
				<UserProfileBadges
					followStatus={follow.status}
					canControlMusic={viewed.listening.canControlMusic}
					hasDevicesOnline={viewed.listening.devices.length > 0}
				/>
			</View>
			{profile.displayName && <Text style={styles.displayName}>{profile.displayName}</Text>}
			<FollowBackHint followStatus={follow.status} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		nameSection: {
			marginTop: theme.spacing.md,
		},
		usernameRow: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.sm,
		},
		username: {
			fontSize: theme.typography.sizes.lg,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
		displayName: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.xxs,
		},
	});
	return styles;
}
