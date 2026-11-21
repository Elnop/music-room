import type {
	PlaybackActions,
	PlaylistPlayback,
} from '@/shared/playback/types/playbackActionsTypes';
import { usePlayStart } from '@/features/playlists/features/editor/features/detail/hooks/usePlayStart';
import type {
	PlayableTrack,
	PlayPlaylist,
} from '@/features/playlists/features/editor/features/detail/types/playPlaylistTypes';

export function usePlayPlaylist(
	playlistId: string,
	playback: PlaybackActions & PlaylistPlayback
): PlayPlaylist {
	const { state } = playback;
	const { pending, pendingRef, start } = usePlayStart(playlistId, playback);

	async function press() {
		if (pendingRef.current) return;
		if (state === 'playing') return playback.pause();
		if (state === 'paused') return playback.resume();
		await start();
	}

	async function playFrom(track: PlayableTrack) {
		if (pendingRef.current || track.trackUri === playback.playingUri) return;
		await start(track.id);
	}

	return {
		loading: pending.active || state === 'loading' || state === 'ready',
		playing: state === 'playing',
		press: () => void press(),
		pendingTrackId: pending.trackId,
		playFrom: track => void playFrom(track),
	};
}
