import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { FollowStatus } from '@/features/friends/types';
import { createUserProfileHeaderStyles } from './userProfileHeaderStyles';
import { Text } from '@/shared/components/ui/Text';

interface UserProfileBadgesProps {
	followStatus: FollowStatus | null;
	canControlMusic: boolean;
	hasDevicesOnline: boolean;
}

/** Beside the username: whether a friend I may control is online, and whether they follow me. */
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
