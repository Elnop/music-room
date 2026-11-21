import React from 'react';
import type { ReactNode } from 'react';
import { usePlayerState } from '@/features/playback/shared/player/hooks/usePlayerState';
import { useActiveQueue } from '@/features/playback/shared/player/hooks/useActiveQueue';
import { selectPlaysPlaylist } from '@/features/playback/shared/player/lib/queueSelectors';
import { playbackActions } from '@/features/playback/lib/playbackActions';
import type {
	PlaybackActions,
	PlaylistPlayback,
} from '@/shared/playback/types/playbackActionsTypes';

interface PlaylistPlaybackContainerProps {
	playlistId: string;
	children: (playback: PlaybackActions & PlaylistPlayback) => ReactNode;
}

export function PlaylistPlaybackContainer({
	playlistId,
	children,
}: PlaylistPlaybackContainerProps) {
	const queueItemId = usePlayerState(state => state.queueItemId);
	const playbackState = usePlayerState(state => state.playbackState);
	const uri = usePlayerState(state => state.currentTrack?.permalink_url ?? null);
	const fromPlaylist = selectPlaysPlaylist(useActiveQueue(), queueItemId, playlistId);
	return (
		<>
			{children({
				...playbackActions,
				playingUri: fromPlaylist ? uri : null,
				state: fromPlaylist ? playbackState : null,
			})}
		</>
	);
}
