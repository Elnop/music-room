import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { usePlayerStore, readPositionMs } from '@/features/player/stores/playerStore';
import { useSession } from '@/shared/services/authSession';
import { isLocalTarget, useIsLocalTarget } from '@/shared/services/connectBridge';
import { lastTrackStorage, type LastTrackEntry } from '@/shared/services/lastTrackStorage';
import { queueTrackToSoundCloud } from '@/shared/utils/trackToSoundCloud';
import { toTrackInput } from '@/shared/utils/trackInput';

export const LAST_TRACK_SAVE_INTERVAL_MS = 10_000;
export const LAST_TRACK_PLAY_SAVE_DELAY_MS = 2000;

const isLocal = () => isLocalTarget();

function snapshot(): LastTrackEntry | null {
	const { currentTrack, queueItemId, playbackState, startPositionMs, needsStreamLoad } =
		usePlayerStore.getState();
	if (!currentTrack) return null;
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

function persist(userId: string): void {
	if (!isLocal()) return;
	const entry = snapshot();
	if (entry) void lastTrackStorage.save(userId, entry);
	else void lastTrackStorage.clear(userId);
}

/**
 * Keeps the player's last track across app restarts (#312), on device and
 * per user. At start-up the saved track comes back paused, without a stream.
 */
export function useLastTrackPersistence(): void {
	const userId = useSession(session => session?.user?.id ?? null);
	const local = useIsLocalTarget();
	const currentTrack = usePlayerStore(state => state.currentTrack);
	const playbackState = usePlayerStore(state => state.playbackState);
	const restoredStartMs = usePlayerStore(state =>
		state.needsStreamLoad ? state.startPositionMs : null
	);
	const [restoredFor, setRestoredFor] = useState<string | null>(null);
	const ready = userId !== null && restoredFor === userId;
	const saveUserId = ready ? userId : null;

	useEffect(() => {
		if (!userId) return;
		let cancelled = false;
		void lastTrackStorage.load(userId).then(entry => {
			if (cancelled) return;
			const player = usePlayerStore.getState();
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
