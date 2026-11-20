import React, { useCallback } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { FriendsStackParamList } from '@/features/user/features/friends/types';
import { useFriendsListScreen } from '@/features/user/features/friends/features/friends-list/hooks/useFriendsListScreen';
import { FriendsListView } from '@/features/user/features/friends/features/friends-list/components/presenters/FriendsListView';

type FriendsOrchestratorProps = Partial<
	NativeStackScreenProps<FriendsStackParamList, 'Friends'>
> & {
	onNavigateToProfile?: (userId: string) => void;
};

export function FriendsContainer({ navigation, onNavigateToProfile }: FriendsOrchestratorProps) {
	const handleSelectUser = useCallback(
		(userId: string) => {
			if (onNavigateToProfile) {
				onNavigateToProfile(userId);
			} else if (navigation) {
				navigation.navigate('UserProfile', { userId });
			}
		},
		[navigation, onNavigateToProfile]
	);

	const screen = useFriendsListScreen(handleSelectUser);

	return <FriendsListView {...screen} />;
}
