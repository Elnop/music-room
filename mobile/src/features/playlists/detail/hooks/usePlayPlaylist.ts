import { useRef, useState } from 'react';
import { getPlayback, usePlaylistPlayback } from '@/shared/services/playbackBridge';
import { showInfo } from '@/shared/utils/toast';

export interface PlayPlaylist {
	loading: boolean;
	playing: boolean;
	press: () => void;
}

/**
 * Play/Pause of a playlist (#277). Play queues the playlist as a block and
 * plays its first track; while this device plays an item queued from it, the
 * button pauses and resumes the audio without any request.
 */
export function usePlayPlaylist(playlistId: string): PlayPlaylist {
	const { state } = usePlaylistPlayback(playlistId);
	const [pending, setPending] = useState(false);
	// Guards a second tap before the re-render that disables the button.
	const pendingRef = useRef(false);
	const playing = state === 'playing';

	const press = async () => {
		if (pendingRef.current) return;
		if (playing) return getPlayback().pause();
		if (state === 'paused') return getPlayback().resume();
		pendingRef.current = true;
		setPending(true);
		try {
			const outcome = await getPlayback().playPlaylist(playlistId);
			if (outcome === 'ignored') showInfo('Une action est déjà en cours');
		} finally {
			pendingRef.current = false;
			setPending(false);
		}
	};

	return {
		loading: pending || state === 'loading' || state === 'ready',
		playing,
		press: () => void press(),
	};
}
