import { registerPlaybackBridge } from '@/shared/playback/lib/playbackBridge';
import { registerConnectBridge } from '@/shared/listening/lib/connectBridge';
import { registerPlayerModals } from '@/shared/player-modals-bridge/playerModalsBridge';
import { registerTrackActionsSheet } from '@/shared/playback/lib/trackActionsBridge';
import { registerFriendsBridge } from '@/shared/backend/lib/friendsBridge';
import { friendsApi } from '@/features/user/features/friends/shared/follows/friendsApi';
import { readPositionMs, usePlayerStore } from '@/features/player/stores/playerStore';
import { useConnectStore } from '@/features/queue/stores/connectStore';
import { useActiveQueue, useQueueStore } from '@/features/queue/stores/queueStore';
import { selectPlaysPlaylist } from '@/features/queue/utils/queueSelectors';
import { QueueModalContainer } from '@/features/queue/queueModal/components/QueueModalContainer';
import { DevicePickerSheetContainer } from '@/features/queue/devicePicker/components/DevicePickerSheetContainer';
import { TrackActionsSheetContainer } from '@/features/playlists/trackActions/components/TrackActionsSheetContainer';

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
		useActiveQueue,
		usePlaybackEmitterState: () => {
			const currentTrack = usePlayerStore(state => state.currentTrack);
			const isPlaying = usePlayerStore(state => state.isPlaying);
			const seekCount = usePlayerStore(state => state.seekCount);
			return { currentTrack, isPlaying, seekCount };
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
		readPositionMs,
		setCurrentQueueItem: (userId, itemId, version) => {
			useQueueStore.getState().setCurrentItem(userId, itemId, version);
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
		QueueModalContainer,
		DevicePickerSheetContainer,
	});

	registerTrackActionsSheet(TrackActionsSheetContainer);

	registerFriendsBridge({
		getFriends: token => friendsApi.getFriends(token),
	});
}
