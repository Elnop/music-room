import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Avatar } from '@/shared/theme/components/Avatar';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { FriendProfile } from '@/features/user/features/friends/friendsTypes';
import type { FriendControl } from '@/features/user/features/friends/features/friends-list/friendsListTypes';
import { FriendCardFooter } from '@/features/user/features/friends/features/friends-list/components/presenters/FriendCardFooter';
import { UserNames } from '@/features/user/features/friends/features/friends-list/components/presenters/UserNames';
import AngleRightSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/angle-right-solid.svg';

type FriendCardProps = {
	friend: FriendProfile;
	control: FriendControl;
	onPress: (userId: string) => void;
};

export function FriendCard({ friend, control, onPress }: FriendCardProps) {
	const { theme, styles } = useThemedStyles(createStyles);
	const name = friend.displayName || friend.username;

	return (
		<View style={control.togglingUserId === friend.id && styles.userItemProcessing}>
			<Pressable
				style={styles.cardHeader}
				onPress={() => onPress(friend.id)}
				accessibilityLabel={name}
			>
				<Avatar size="md" name={name} uri={friend.avatarUrl} />
				<UserNames user={friend} singleLine />
				<PixelIcon icon={AngleRightSolid} size={20} color={theme.colors.textSecondary} />
			</Pressable>
			<FriendCardFooter friendId={friend.id} name={name} control={control} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		userItemProcessing: {
			opacity: 0.7,
		},
		cardHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingTop: theme.spacing.sm,
			paddingHorizontal: theme.spacing.md,
		},
	});
	return styles;
}
