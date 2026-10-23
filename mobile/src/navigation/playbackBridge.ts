import { registerPlaybackBridge } from '@/shared/services/playbackBridge';
import { registerConnectBridge } from '@/shared/services/connectBridge';
import { registerPlayerModals } from '@/shared/services/playerModalsBridge';
import { registerTrackActionsSheet } from '@/shared/services/trackActionsBridge';
import { usePlayerHeight } from '@/features/player/context/PlayerContext';
import { readPositionMs, usePlayerStore } from '@/features/player/stores/playerStore';
import { useConnectStore } from '@/features/queue/stores/connectStore';
import { useActiveQueue, useQueueStore } from '@/features/queue/stores/queueStore';
import { selectPlaysPlaylist } from '@/features/queue/utils/queueSelectors';
import { QueueModal } from '@/features/queue/components/queueModal/components/orchestrators/QueueModal';
import { DevicePickerSheet } from '@/features/queue/components/devicePicker/components/orchestrators/DevicePickerSheet';
import { TrackActionsSheet } from '@/features/playlists/trackActions/components/orchestrators/TrackActionsSheet';

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
		useActiveQueue,
		addToQueue: track => useQueueStore.getState().addItem(track),
		playNext: track => useQueueStore.getState().playNext(track),
		playPlaylist: playlistId => useQueueStore.getState().playPlaylist(playlistId),
		next: () => useQueueStore.getState().next(),
		previous: () => useQueueStore.getState().previous(),
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
	});

	registerConnectBridge({
		useConnect: selector => useConnectStore(selector),
		useIsLocal: () => useConnectStore(s => s.target.kind === 'local'),
		getConnectState: () => useConnectStore.getState(),
		setRemoteStatus: status => useConnectStore.getState().setRemoteStatus(status),
		setControlPending: pending => useConnectStore.getState().setControlPending(pending),
		setLocal: message => useConnectStore.getState().setLocal(message),
		setRemote: target => useConnectStore.getState().setRemote(target),
	});

	registerPlayerModals({
		QueueModal,
		DevicePickerSheet,
	});

	registerTrackActionsSheet(TrackActionsSheet);
}
