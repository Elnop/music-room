import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { FriendProfile } from '@/features/user/features/friends/friendsTypes';
import type { FriendControl } from '@/features/user/features/friends/features/friends-list/friendsListTypes';
import { ControlSwitch } from '@/features/user/features/friends/features/friends-list/components/presenters/ControlSwitch';
import { FriendControlHint } from '@/features/user/features/friends/features/friends-list/components/presenters/FriendControlHint';
import { UserRow } from '@/features/user/features/friends/features/friends-list/components/presenters/UserRow';

type FriendItemRowProps = {
	friend: FriendProfile;
	control: FriendControl;
	onPress: (userId: string) => void;
};

export function FriendItemRow({ friend, control, onPress }: FriendItemRowProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<UserRow
			user={friend}
			onPress={onPress}
			dimmed={control.togglingUserId === friend.id}
			hint={<FriendControlHint canControl={control.canControl(friend.id)} />}
			trailing={
				<View style={styles.controlToggle}>
					<ControlSwitch
						friendId={friend.id}
						control={control}
						accessibilityLabel={`${friend.displayName || friend.username} peut contrôler ma musique`}
					/>
				</View>
			}
		/>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		controlToggle: {
			alignItems: 'center',
			justifyContent: 'center',
			marginRight: theme.spacing.sm,
		},
	});
	return styles;
}
