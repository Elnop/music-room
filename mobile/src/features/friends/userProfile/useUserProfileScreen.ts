import { useState, useCallback, useEffect } from 'react';
import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import { useScreenTitle } from '@/shared/screen-title/useScreenTitle';
import { useFriendListening } from '@/shared/backend/lib/musicControlBridge';
import { controlErrorMessage } from '@/shared/control-error/controlError';
import { showError } from '@/shared/theme/lib/toast';
import { logger } from '@/shared/logging/logger';
import {
	useUserProfile,
	useFollowStatus,
	useUserPublicPlaylists,
} from '@/features/friends/hooks/useFriendsQueries';
import { useFollowMutation } from '@/features/friends/hooks/useFriendsMutations';

export function useUserProfileScreen(userId: string) {
	const bottomPadding = useBottomPadding();
	const {
		data: profile,
		isLoading: isProfileLoading,
		error: profileError,
	} = useUserProfile(userId);
	const { data: followStatus, isLoading: isStatusLoading } = useFollowStatus(userId);
	const { data: playlists = [] } = useUserPublicPlaylists(userId);
	const followMutation = useFollowMutation();
	useScreenTitle(profile ? profile.displayName || profile.username : undefined);

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
		bottomPadding,
	};
}
