import { usePlayerStore } from '@/features/playback/shared/player/stores/playerStore';
import { useQueueStore } from '@/features/playback/shared/player/stores/queueStore';
import type { PlaybackActions } from '@/shared/playback/types/playbackActionsTypes';

export const playbackActions: PlaybackActions = {
	addToQueue: track => useQueueStore.getState().addItem(track),
	playNext: track => useQueueStore.getState().playNext(track),
	playListTrack: track => useQueueStore.getState().playListTrack(track),
	playPlaylist: (playlistId, startTrackId) =>
		useQueueStore.getState().playPlaylist(playlistId, startTrackId),
	pause: () => usePlayerStore.getState().pause(),
	resume: () => usePlayerStore.getState().resume(),
};
