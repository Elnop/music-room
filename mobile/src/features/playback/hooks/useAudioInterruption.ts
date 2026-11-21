import { useEffect, useRef } from 'react';
import { useAudioPlayerStatus } from '@/features/playback/shared/player/lib/audioPlayer';
import { followNativePlaying, isSettled } from '@/features/playback/lib/nativeInterruption';
import { isLocalTarget } from '@/features/playback/shared/player/lib/connectTarget';
import type { AudioPlayer } from '@/features/playback/shared/player/types/playerTypes';

export function useAudioInterruption(player: AudioPlayer): void {
	const status = useAudioPlayerStatus(player);
	const lastRef = useRef<{ id: number; playing: boolean } | null>(null);
	const statusId = status?.id;
	const nativePlaying = status?.playing === true;
	const settled = isSettled(status);

	useEffect(() => {
		if (statusId === undefined || statusId !== player?.id) return;
		const last = lastRef.current;
		const wasPlaying = last !== null && last.id === statusId && last.playing;
		lastRef.current = { id: statusId, playing: nativePlaying };
		if (wasPlaying === nativePlaying || !isLocalTarget() || !settled) return;
		if (player.playing !== nativePlaying) return;
		followNativePlaying(player, nativePlaying);
	}, [statusId, player, nativePlaying, settled]);
}
