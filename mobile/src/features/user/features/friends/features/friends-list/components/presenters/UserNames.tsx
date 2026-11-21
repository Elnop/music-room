import React from 'react';
import { StyleSheet, View } from 'react-native';
import { UserNameLines } from '@/shared/theme/components/UserNameLines';
import type { FriendProfile } from '@/features/user/features/friends/friendsTypes';

type UserNamesProps = {
	user: Pick<FriendProfile, 'username' | 'displayName'>;
	singleLine?: boolean;
	children?: React.ReactNode;
};

export function UserNames({ user, singleLine = false, children }: UserNamesProps) {
	return (
		<View style={styles.userInfo}>
			<UserNameLines
				username={user.username}
				displayName={user.displayName}
				singleLine={singleLine}
			/>
			{children}
		</View>
	);
}

const styles = StyleSheet.create({
	userInfo: {
		flex: 1,
	},
});
