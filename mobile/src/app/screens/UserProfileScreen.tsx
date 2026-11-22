import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { UserProfileContainer } from '@/features/user/features/friends/features/user-profile/components/UserProfileContainer';
import { FriendListeningContainer } from '@/features/playback/features/control-delegation/FriendListeningContainer';
import type { FriendsStackParamList } from '@/features/user/features/friends/friendsTypes';

type UserProfileScreenProps = NativeStackScreenProps<FriendsStackParamList, 'UserProfile'>;

export function UserProfileScreen(props: UserProfileScreenProps) {
	return (
		<FriendListeningContainer userId={props.route.params.userId}>
			{(listening) => <UserProfileContainer {...props} listening={listening} />}
		</FriendListeningContainer>
	);
}
