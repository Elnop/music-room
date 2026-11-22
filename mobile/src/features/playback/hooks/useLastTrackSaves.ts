import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useIsLocalTarget } from '@/features/playback/hooks/useIsLocalTarget';
import { persistLastTrack } from '@/features/playback/lib/persistLastTrack';
import { usePlayerState } from '@/features/playback/shared/player/hooks/usePlayerState';
import { LAST_TRACK_SAVE_INTERVAL_MS } from '@/features/playback/lastTrackConfig';

export function useLastTrackSaves(saveUserId: string | null): void {
	const local = useIsLocalTarget();
	const playbackState = usePlayerState((state) => state.playbackState);

	useEffect(() => {
		if (!saveUserId || !local || playbackState !== 'playing') return;
		const timer = setInterval(() => persistLastTrack(saveUserId), LAST_TRACK_SAVE_INTERVAL_MS);
		return () => clearInterval(timer);
	}, [saveUserId, local, playbackState]);

	useEffect(() => {
		if (!saveUserId) return;
		const subscription = AppState.addEventListener('change', (next) => {
			if (next !== 'active') persistLastTrack(saveUserId);
		});
		return () => subscription.remove();
	}, [saveUserId]);
}
