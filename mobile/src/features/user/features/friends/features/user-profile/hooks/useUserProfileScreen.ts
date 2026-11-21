import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import { useScreenTitle } from '@/shared/screen-title/useScreenTitle';
import type { FriendListeningResult } from '@/features/playback/features/control-delegation/shared/delegation/lib/types';
import type { FriendPlaylistSummary } from '@/features/user/features/friends/friendsTypes';
import type { ProfileListening } from '@/features/user/features/friends/features/user-profile/userProfileTypes';
import {
	useFollowStatus,
	useUserProfile,
	useUserPublicPlaylists,
} from '@/features/user/features/friends/features/user-profile/hooks/useUserProfileQueries';
import { useProfileFollow } from '@/features/user/features/friends/features/user-profile/hooks/useProfileFollow';
import { useControlErrorToast } from '@/features/user/features/friends/features/user-profile/hooks/useControlErrorToast';

const NO_PLAYLISTS: FriendPlaylistSummary[] = [];

function profileListening(listening: FriendListeningResult): ProfileListening {
	return {
		canControlMusic: listening.canControl,
		devices: listening.devices,
		isLoading: listening.isLoading,
		onRemotePlay: listening.remotePlay,
		onRemotePause: listening.remotePause,
	};
}

export function useUserProfileScreen(userId: string, listening: FriendListeningResult) {
	const { data: profile, isLoading: isProfileLoading, error } = useUserProfile(userId);
	const { data: followStatus, isLoading: isStatusLoading } = useFollowStatus(userId);
	useScreenTitle(profile ? profile.displayName || profile.username : undefined);
	useControlErrorToast(listening.controlError);

	return {
		userId,
		profile: profile ?? null,
		playlists: useUserPublicPlaylists(userId).data ?? NO_PLAYLISTS,
		isLoading: isProfileLoading || isStatusLoading,
		error: error ? 'Impossible de charger le profil' : null,
		follow: useProfileFollow(userId, followStatus ?? null),
		listening: profileListening(listening),
		bottomPadding: useBottomPadding(),
	};
}
