import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/shared/theme/components/Button';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { FollowStatus } from '@/features/user/features/friends/friendsTypes';
import type { ProfileFollow } from '@/features/user/features/friends/features/user-profile/userProfileTypes';
import { FriendBadge } from '@/features/user/features/friends/features/user-profile/components/presenters/FriendBadge';

type FollowButtonsProps = {
	status: FollowStatus;
	follow: ProfileFollow;
};

export function FollowButtons({ status, follow }: FollowButtonsProps) {
	const { styles } = useThemedStyles(createStyles);
	const isFollowing = status.isFriend || status.isFollowing;

	return (
		<View style={styles.actionButtons}>
			{status.isFriend && <FriendBadge />}
			<Button
				variant={isFollowing ? 'outline' : 'primary'}
				onPress={follow.onToggle}
				loading={follow.isLoading}
				style={styles.actionButton}
				title={isFollowing ? 'Abonné' : 'Suivre'}
			/>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		actionButtons: {
			flexDirection: 'row',
			gap: theme.spacing.sm,
			marginTop: theme.spacing.lg,
		},
		actionButton: {
			flex: 1,
		},
	});
	return styles;
}
