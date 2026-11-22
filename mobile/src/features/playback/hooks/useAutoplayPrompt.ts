import { useEffect, useRef } from 'react';
import { useAutoplayState } from '@/features/playback/hooks/useAutoplayState';
import { showAutoplayPrompt } from '@/features/playback/lib/showAutoplayPrompt';
import type { AudioPlayer } from '@/features/playback/shared/player/types/playerTypes';

export function useAutoplayPrompt(player: AudioPlayer): void {
	const blocked = useAutoplayState((state) => state.blocked);
	const playerRef = useRef(player);
	useEffect(() => {
		playerRef.current = player;
	}, [player]);

	useEffect(() => {
		if (!blocked) return;
		showAutoplayPrompt(() => playerRef.current.play());
	}, [blocked]);
}
