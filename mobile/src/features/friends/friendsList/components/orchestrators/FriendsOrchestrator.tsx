import React, { useCallback } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { FriendsStackParamList } from '@/features/friends/types';
import { useFriendsListScreen } from '@/features/friends/friendsList/hooks/useFriendsListScreen';
import { FriendsListView } from '@/features/friends/friendsList/components/presenters/FriendsListView';

type FriendsOrchestratorProps = Partial<
	NativeStackScreenProps<FriendsStackParamList, 'Friends'>
> & {
	onNavigateToProfile?: (userId: string) => void;
};

export function FriendsOrchestrator({ navigation, onNavigateToProfile }: FriendsOrchestratorProps) {
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
