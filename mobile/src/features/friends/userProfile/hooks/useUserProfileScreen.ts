import { useState, useCallback, useEffect } from 'react';
import { usePlayerHeight } from '@/shared/services/playbackBridge';
import { useFriendListening } from '@/shared/services/musicControlBridge';
import { controlErrorMessage } from '@/shared/utils/controlError';
import { showError } from '@/shared/utils/toast';
import { logger } from '@/shared/utils/logger';
import {
	useUserProfile,
	useFollowStatus,
	useUserPublicPlaylists,
} from '@/features/friends/hooks/useFriendsQueries';
import { useFollowMutation } from '@/features/friends/hooks/useFriendsMutations';

export function useUserProfileScreen(userId: string) {
	const playerHeight = usePlayerHeight();
	const {
		data: profile,
		isLoading: isProfileLoading,
		error: profileError,
	} = useUserProfile(userId);
	const { data: followStatus, isLoading: isStatusLoading } = useFollowStatus(userId);
	const { data: playlists = [] } = useUserPublicPlaylists(userId);
	const followMutation = useFollowMutation();

	const [isFollowLoading, setIsFollowLoading] = useState(false);

	const {
		devices,
		canControl: canControlMusic,
		remotePlay,
		remotePause,
		isLoading: isListeningLoading,
		controlError,
	} = useFriendListening(userId);

	useEffect(() => {
		if (controlError) {
			showError(controlErrorMessage(controlError));
		}
	}, [controlError]);

	const handleFollowToggle = useCallback(async () => {
		if (!followStatus) return;
		setIsFollowLoading(true);
		try {
			await followMutation.mutateAsync({
				userId,
				shouldFollow: !followStatus.isFollowing,
			});
		} catch (err) {
			logger.error('[UserProfile] Follow toggle failed', {
				error: err,
				userId,
				isFollowing: followStatus.isFollowing,
			});
		} finally {
			setIsFollowLoading(false);
		}
	}, [followMutation, followStatus, userId]);

	const isLoading = isProfileLoading || isStatusLoading;
	const errorMessage = profileError ? 'Impossible de charger le profil' : null;

	return {
		userId,
		profile: profile ?? null,
		followStatus: followStatus ?? null,
		playlists,
		isLoading,
		error: errorMessage,
		isFollowLoading,
		onFollowToggle: handleFollowToggle,
		canControlMusic,
		devices,
		isListeningLoading,
		onRemotePlay: remotePlay,
		onRemotePause: remotePause,
		playerHeight,
	};
}
