import { useRef, useState } from 'react';
import type { PlaybackActions, PlaylistPlayback } from '@/shared/playback/lib/playbackActions';
import { showInfo } from '@/shared/theme/lib/toast';

export type PlayPlaylist = {
	loading: boolean;
	playing: boolean;
	press: () => void;
	pendingTrackId: string | null;
	playFrom: (track: { id: string; trackUri: string }) => void;
};

export function usePlayPlaylist(
	playlistId: string,
	playback: PlaybackActions & PlaylistPlayback
): PlayPlaylist {
	const { playingUri, state } = playback;
	const [pending, setPending] = useState(false);
	const [pendingTrackId, setPendingTrackId] = useState<string | null>(null);
	const pendingRef = useRef(false);
	const playing = state === 'playing';

	async function start(startTrackId?: string) {
		pendingRef.current = true;
		setPending(true);
		setPendingTrackId(startTrackId ?? null);
		try {
			const outcome = await playback.playPlaylist(playlistId, startTrackId);
			if (outcome === 'ignored') showInfo('Une action est déjà en cours');
		} finally {
			pendingRef.current = false;
			setPending(false);
			setPendingTrackId(null);
		}
	}

	async function press() {
		if (pendingRef.current) return;
		if (playing) return playback.pause();
		if (state === 'paused') return playback.resume();
		await start();
	}

	async function playFrom(track: { id: string; trackUri: string }) {
		if (pendingRef.current || track.trackUri === playingUri) return;
		await start(track.id);
	}

	return {
		loading: pending || state === 'loading' || state === 'ready',
		playing,
		press: () => void press(),
		pendingTrackId,
		playFrom: track => void playFrom(track),
	};
}
