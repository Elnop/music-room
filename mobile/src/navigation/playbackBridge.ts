import { registerPlaybackBridge } from '@/shared/services/playbackBridge';
import { usePlayerHeight } from '@/contexts/PlayerContext';
import { usePlayerStore } from '@/store/playerStore';
import { useActiveQueue, useQueueStore } from '@/store/queueStore';
import { selectPlaysPlaylist } from '@/store/queueSelectors';

/**
 * Plugs the player and the queue into the playback contract of `shared/`, so
 * the playlists feature reaches them without importing them. AppNavigator calls
 * it once, at load, before anything renders.
 */
export function registerPlayback(): void {
	registerPlaybackBridge({
		usePlaylistPlayback: playlistId => {
			const queueItemId = usePlayerStore(state => state.queueItemId);
			const playbackState = usePlayerStore(state => state.playbackState);
			const uri = usePlayerStore(state => state.currentTrack?.permalink_url ?? null);
			const fromPlaylist = selectPlaysPlaylist(useActiveQueue(), queueItemId, playlistId);
			return {
				playingUri: fromPlaylist ? uri : null,
				state: fromPlaylist ? playbackState : null,
			};
		},
		usePlayerHeight,
		addToQueue: track => useQueueStore.getState().addItem(track),
		playNext: track => useQueueStore.getState().playNext(track),
		playPlaylist: playlistId => useQueueStore.getState().playPlaylist(playlistId),
		pause: () => usePlayerStore.getState().pause(),
		resume: () => usePlayerStore.getState().resume(),
	});
}
