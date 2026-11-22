import type { Socket } from 'socket.io-client';
import { watchPlayerState } from '@/features/playback/shared/player/lib/watchPlayerState';
import { emitListeningStatus } from '@/features/playback/features/control-delegation/lib/emitListeningStatus';
import type { PlayerState } from '@/features/playback/shared/player/types/playerStateTypes';

const STATUS_DELAY_MS = 200;

function reported(state: PlayerState) {
	return [state.currentTrack, state.isPlaying, state.seekCount];
}

export function watchListeningStatus(socket: Socket): () => void {
	let timer: ReturnType<typeof setTimeout> | null = null;
	const stop = watchPlayerState(reported, (state) => {
		if (timer) clearTimeout(timer);
		timer = setTimeout(
			() => emitListeningStatus(socket, state.currentTrack, state.isPlaying),
			STATUS_DELAY_MS,
		);
	});
	return () => {
		if (timer) clearTimeout(timer);
		stop();
	};
}
