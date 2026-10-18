import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { usePlayerStore, readPositionMs } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { useConnectStore } from '@/store/connectStore';
import { lastTrackStorage, type LastTrackEntry } from '@/services/lastTrackStorage';
import { queueTrackToSoundCloud } from '@utils/trackToSoundCloud';
import { toTrackInput } from '@utils/trackInput';

/** How often the position is saved while a track plays. */
export const LAST_TRACK_SAVE_INTERVAL_MS = 10_000;

/** Delay of the save on play: the start seek lands after the store says playing. */
export const LAST_TRACK_PLAY_SAVE_DELAY_MS = 2000;

const isLocal = () => useConnectStore.getState().target.kind === 'local';

/** What the player holds now, as a stored entry; null without a track. */
function snapshot(): LastTrackEntry | null {
	const { currentTrack, queueItemId, playbackState, startPositionMs, needsStreamLoad } =
		usePlayerStore.getState();
	if (!currentTrack) return null;
	// A restored or loading track is not in the player yet: use where it starts.
	const position =
		needsStreamLoad || playbackState === 'loading'
			? startPositionMs
			: (readPositionMs() ?? startPositionMs);
	const input = toTrackInput(currentTrack);
	return {
		track: {
			trackUri: input.trackUri,
			title: input.title,
			artist: input.artist,
			album: input.album ?? null,
			albumArt: input.albumArt ?? null,
			durationMs: input.durationMs,
		},
		queueItemId,
		positionMs:
			position !== null && Number.isFinite(position) ? Math.max(0, Math.round(position)) : 0,
	};
}

/** Save what the player holds for `userId`, or delete the entry once it is empty; local mode only. */
function persist(userId: string): void {
	if (!isLocal()) return;
	const entry = snapshot();
	if (entry) void lastTrackStorage.save(userId, entry);
	else void lastTrackStorage.clear(userId);
}

/**
 * Keeps the player's last track across app restarts (#312), on the device and
 * per user. At start-up the saved track comes back paused, without a stream:
 * play loads a fresh one at the saved position. Only in local mode, and only
 * while the player is still empty. The track is saved on change, on pause,
 * every LAST_TRACK_SAVE_INTERVAL_MS while playing and when the app leaves the
 * foreground; an emptied player deletes the entry.
 */
export function useLastTrackPersistence(): void {
	const userId = useAuthStore(state => state.user?.id ?? null);
	const local = useConnectStore(state => state.target.kind === 'local');
	const currentTrack = usePlayerStore(state => state.currentTrack);
	const playbackState = usePlayerStore(state => state.playbackState);
	// A seek on a restored track only moves its start position.
	const restoredStartMs = usePlayerStore(state =>
		state.needsStreamLoad ? state.startPositionMs : null
	);
	// The user whose restore has run: saving before it would overwrite the entry.
	const [restoredFor, setRestoredFor] = useState<string | null>(null);
	const ready = userId !== null && restoredFor === userId;
	// Only the user whose restore has run is saved for.
	const saveUserId = ready ? userId : null;

	useEffect(() => {
		if (!userId) return;
		let cancelled = false;
		void lastTrackStorage.load(userId).then(entry => {
			if (cancelled) return;
			const player = usePlayerStore.getState();
			// A track the user started first wins; remote mode plays nothing here.
			if (entry && !player.currentTrack && isLocal()) {
				player.restoreTrack(
					queueTrackToSoundCloud(entry.track),
					entry.queueItemId,
					entry.positionMs
				);
			}
			setRestoredFor(userId);
		});
		return () => {
			cancelled = true;
		};
	}, [userId]);

	// Track change, pause, play, emptied player.
	useEffect(() => {
		if (!saveUserId || playbackState === 'ready') return;
		if (playbackState === 'playing') {
			const timer = setTimeout(() => persist(saveUserId), LAST_TRACK_PLAY_SAVE_DELAY_MS);
			return () => clearTimeout(timer);
		}
		persist(saveUserId);
	}, [saveUserId, currentTrack, playbackState, restoredStartMs]);

	useEffect(() => {
		if (!saveUserId || !local || playbackState !== 'playing') return;
		const timer = setInterval(() => persist(saveUserId), LAST_TRACK_SAVE_INTERVAL_MS);
		return () => clearInterval(timer);
	}, [saveUserId, local, playbackState]);

	useEffect(() => {
		if (!saveUserId) return;
		const subscription = AppState.addEventListener('change', next => {
			if (next !== 'active') persist(saveUserId);
		});
		return () => subscription.remove();
	}, [saveUserId]);
}
