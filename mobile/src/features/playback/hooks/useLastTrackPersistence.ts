import { useEffect } from 'react';
import { useSession } from '@/shared/backend/hooks/useSession';
import { useLastTrackRestore } from '@/features/playback/hooks/useLastTrackRestore';
import { useLastTrackSaves } from '@/features/playback/hooks/useLastTrackSaves';
import { persistLastTrack } from '@/features/playback/lib/persistLastTrack';
import { usePlayerState } from '@/features/playback/shared/player/hooks/usePlayerState';
import { LAST_TRACK_PLAY_SAVE_DELAY_MS } from '@/features/playback/lastTrackConfig';

export function useLastTrackPersistence(): void {
	const userId = useSession(session => session?.user?.id ?? null);
	const saveUserId = useLastTrackRestore(userId);
	const currentTrack = usePlayerState(state => state.currentTrack);
	const playbackState = usePlayerState(state => state.playbackState);
	const restoredStartMs = usePlayerState(state =>
		state.needsStreamLoad ? state.startPositionMs : null
	);

	useEffect(() => {
		if (!saveUserId || playbackState === 'ready') return;
		if (playbackState === 'playing') {
			const timer = setTimeout(() => persistLastTrack(saveUserId), LAST_TRACK_PLAY_SAVE_DELAY_MS);
			return () => clearTimeout(timer);
		}
		persistLastTrack(saveUserId);
	}, [saveUserId, currentTrack, playbackState, restoredStartMs]);

	useLastTrackSaves(saveUserId);
}
