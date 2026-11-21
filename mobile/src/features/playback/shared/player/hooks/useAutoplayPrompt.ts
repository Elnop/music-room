import { useEffect, useRef } from 'react';
import { useAutoplayStore } from '@/features/playback/shared/player/stores/autoplayStore';
import { usePlayerStore } from '@/features/playback/shared/player/stores/playerStore';
import type { AudioPlayer } from '@/features/playback/shared/player/lib/types';
import { showAlert } from '@/shared/alerts/showAlert';

export function useAutoplayPrompt(player: AudioPlayer): void {
	const blocked = useAutoplayStore(state => state.blocked);
	const playerRef = useRef(player);
	useEffect(() => {
		playerRef.current = player;
	}, [player]);

	useEffect(() => {
		if (!blocked) return;
		const { setBlocked } = useAutoplayStore.getState();
		const title = usePlayerStore.getState().currentTrack?.title;
		showAlert(
			'Cliquer pour activer le son',
			title ? `Le navigateur attend un clic pour lire « ${title} ».` : '',
			[
				{ text: 'Plus tard', style: 'cancel', onPress: () => setBlocked(false) },
				{
					text: 'Activer le son',
					onPress: () => {
						playerRef.current.play();
						setBlocked(false);
						usePlayerStore.getState().resume();
					},
				},
			]
		);
	}, [blocked]);
}
