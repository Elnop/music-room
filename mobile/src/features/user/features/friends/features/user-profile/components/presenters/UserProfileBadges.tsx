import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { FollowStatus } from '@/features/user/features/friends/types';
import { createUserProfileHeaderStyles } from '@/features/user/features/friends/features/user-profile/lib/userProfileHeaderStyles';
import { Text } from '@/shared/theme/components/Text';

type UserProfileBadgesProps = {
	followStatus: FollowStatus | null;
	canControlMusic: boolean;
	hasDevicesOnline: boolean;
};

export function UserProfileBadges({
	followStatus,
	canControlMusic,
	hasDevicesOnline,
}: UserProfileBadgesProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createUserProfileHeaderStyles(theme), [theme]);

	return (
		<>
			{followStatus?.isFriend && canControlMusic && (
				<View style={[styles.statusBadge, hasDevicesOnline && styles.statusBadgeOnline]}>
					<View style={[styles.statusDot, hasDevicesOnline && styles.statusDotOnline]} />
					<Text style={[styles.statusText, hasDevicesOnline && styles.statusTextOnline]}>
						{hasDevicesOnline ? 'En ligne' : 'Hors ligne'}
					</Text>
				</View>
			)}
			{followStatus?.isFollowedBy && (
				<View style={styles.followsYouBadge}>
					<Text style={styles.followsYouText}>Vous suit</Text>
				</View>
			)}
		</>
	);
}
