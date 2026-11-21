import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LoadingSpinner } from '@/shared/theme/components/LoadingSpinner';
import { ProfileScreenFrame } from '@/features/user/shared/profile-layout/ProfileScreenFrame';
import type { FriendsStackParamList } from '@/features/user/features/friends/friendsTypes';
import type { FriendListeningResult } from '@/features/playback/features/control-delegation/shared/delegation/types/delegationTypes';
import { useUserProfileScreen } from '@/features/user/features/friends/features/user-profile/hooks/useUserProfileScreen';
import { usePlaylistNavigation } from '@/features/user/features/friends/features/user-profile/hooks/usePlaylistNavigation';
import { UserProfileView } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileView';

type UserProfileContainerProps = Partial<
	NativeStackScreenProps<FriendsStackParamList, 'UserProfile'>
> & {
	userId?: string;
	listening: FriendListeningResult;
	onNavigateToPlaylist?: (playlistId: string) => void;
};

export function UserProfileContainer(props: UserProfileContainerProps) {
	const userId = props.userId || props.route?.params?.userId || '';
	const screen = useUserProfileScreen(userId, props.listening);
	const onSelectPlaylist = usePlaylistNavigation(props.navigation, props.onNavigateToPlaylist);

	if (screen.isLoading) {
		return <LoadingSpinner fullScreen message="Chargement du profil…" />;
	}

	if (screen.error || !screen.profile) {
		return (
			<ProfileScreenFrame bottomPadding={0} errorMessage={screen.error || 'Profil introuvable'} />
		);
	}

	return (
		<UserProfileView
			viewed={{
				userId: screen.userId,
				profile: screen.profile,
				playlists: { items: screen.playlists, onSelect: onSelectPlaylist },
				follow: screen.follow,
				listening: screen.listening,
			}}
			bottomPadding={screen.bottomPadding}
		/>
	);
}
