import { registerPlaybackBridge } from '@/shared/playback/lib/playbackBridge';
import {
	readPositionMs,
	usePlayerStore,
} from '@/features/playback/shared/player/stores/playerStore';
import { useActiveQueue, useQueueStore } from '@/features/playback/shared/player/stores/queueStore';
import { selectPlaysPlaylist } from '@/features/playback/shared/player/lib/queueSelectors';

/** Lets playlists reach the player and queue without importing them. */
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
		addToQueue: track => useQueueStore.getState().addItem(track),
		playNext: track => useQueueStore.getState().playNext(track),
		playPlaylist: (playlistId, startTrackId) =>
			useQueueStore.getState().playPlaylist(playlistId, startTrackId),
		next: () => useQueueStore.getState().next(),
		previous: () => useQueueStore.getState().previous(),
		playItem: itemId => useQueueStore.getState().playItem(itemId),
		playListTrack: track => useQueueStore.getState().playListTrack(track),
		playTrack: (track, queueItemId, startPositionMs) =>
			usePlayerStore.getState().playTrack(track, queueItemId, startPositionMs),
		pause: () => usePlayerStore.getState().pause(),
		resume: () => usePlayerStore.getState().resume(),
		stop: () => usePlayerStore.getState().stop(),
		getPlayerState: () => {
			const s = usePlayerStore.getState();
			return {
				currentTrack: s.currentTrack,
				queueItemId: s.queueItemId,
				loadCounter: s.loadCounter,
				positionMs: readPositionMs() ?? 0,
			};
		},
		setCurrentQueueItem: (userId, itemId, version) => {
			useQueueStore.getState().setCurrentItem(userId, itemId, version);
		},
	});
}
