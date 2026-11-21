import React from 'react';
import type { ReactNode } from 'react';
import { usePlayerStore } from '@/features/playback/shared/player/stores/playerStore';
import { useActiveQueue } from '@/features/playback/shared/player/stores/queueStore';
import { selectPlaysPlaylist } from '@/features/playback/shared/player/lib/queueSelectors';
import { playbackActions } from '@/features/playback/lib/playbackActions';
import type { PlaybackActions, PlaylistPlayback } from '@/shared/playback/lib/playbackActions';

interface PlaylistPlaybackContainerProps {
	playlistId: string;
	children: (playback: PlaybackActions & PlaylistPlayback) => ReactNode;
}

export function PlaylistPlaybackContainer({
	playlistId,
	children,
}: PlaylistPlaybackContainerProps) {
	const queueItemId = usePlayerStore(state => state.queueItemId);
	const playbackState = usePlayerStore(state => state.playbackState);
	const uri = usePlayerStore(state => state.currentTrack?.permalink_url ?? null);
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
