import type { Socket } from 'socket.io-client';
import { readPositionMs } from '@/features/playback/shared/player/lib/positionReader';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';

function currentPositionMs(): number {
	const position = readPositionMs();
	return position != null && Number.isFinite(position) ? Math.max(0, Math.round(position)) : 0;
}

export function emitListeningStatus(
	socket: Socket,
	currentTrack: SoundCloudTrack | null,
	isPlaying: boolean,
): void {
	const status = {
		track: currentTrack
			? {
					id: currentTrack.id,
					title: currentTrack.title,
					artist: currentTrack.user.username,
					artworkUrl: currentTrack.artwork_url,
				}
			: null,
		isPlaying,
		positionMs: currentPositionMs(),
	};
	socket.emit('listening:update', status);
}
