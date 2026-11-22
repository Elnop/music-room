import { playerStore } from '@/features/playback/shared/player/stores/playerStore';
import { queueStore } from '@/features/playback/shared/player/stores/queueStore';
import type { PlaybackActions } from '@/shared/playback/types/playbackActionsTypes';

export const playbackActions: PlaybackActions = {
	addToQueue: (track) => queueStore.getState().addItem(track),
	playNext: (track) => queueStore.getState().playNext(track),
	playListTrack: (track) => queueStore.getState().playListTrack(track),
	playPlaylist: (playlistId, startTrackId) =>
		queueStore.getState().playPlaylist(playlistId, startTrackId),
	pause: () => playerStore.getState().pause(),
	resume: () => playerStore.getState().resume(),
};
