import { Command, PlaybackState } from 'expo-media-control';
import { logger } from '@/shared/logging/logger';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';

export function safely(call: Promise<void>): void {
	call.catch(err => {
		logger.debug('[MediaSession] Media control call failed:', err);
	});
}

export function mediaCapabilities(
	nowPlaying: Pick<NowPlaying, 'isRemote' | 'hasNext' | 'hasPrevious'>
): Command[] {
	const capabilities = [Command.PLAY, Command.PAUSE];
	if (!nowPlaying.isRemote || nowPlaying.hasPrevious) capabilities.push(Command.PREVIOUS_TRACK);
	if (nowPlaying.hasNext) capabilities.push(Command.NEXT_TRACK);
	if (!nowPlaying.isRemote) capabilities.push(Command.SEEK);
	return capabilities;
}

export function systemState(nowPlaying: NowPlaying): PlaybackState {
	if (nowPlaying.isLoading) return PlaybackState.BUFFERING;
	return nowPlaying.isPlaying ? PlaybackState.PLAYING : PlaybackState.PAUSED;
}

export function mediaDurationSeconds(durationMs: number | null): number | null {
	return durationMs && durationMs > 0 ? Math.round(durationMs / 1000) : null;
}

export function sentKey(nowPlaying: NowPlaying): string {
	return `${nowPlaying.track?.id ?? ''}:${mediaDurationSeconds(nowPlaying.durationMs) ?? ''}`;
}
