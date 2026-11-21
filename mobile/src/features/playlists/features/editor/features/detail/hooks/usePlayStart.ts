import { useRef, useState } from 'react';
import type { PlaybackActions } from '@/shared/playback/types/playbackActionsTypes';
import { showInfo } from '@/shared/theme/lib/toast';
import type {
	PendingPlay,
	PlayStart,
} from '@/features/playlists/features/editor/features/detail/types/playPlaylistTypes';

const IDLE: PendingPlay = { active: false, trackId: null };

export function usePlayStart(playlistId: string, playback: PlaybackActions): PlayStart {
	const [pending, setPending] = useState<PendingPlay>(IDLE);
	const pendingRef = useRef(false);

	async function start(startTrackId?: string) {
		pendingRef.current = true;
		setPending({ active: true, trackId: startTrackId ?? null });
		try {
			const outcome = await playback.playPlaylist(playlistId, startTrackId);
			if (outcome === 'ignored') showInfo('Une action est déjà en cours');
		} finally {
			pendingRef.current = false;
			setPending(IDLE);
		}
	}

	return { pending, pendingRef, start };
}
