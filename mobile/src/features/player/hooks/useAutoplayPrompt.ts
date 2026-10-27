import { useEffect, useRef } from 'react';
import { useAutoplayStore } from '@/features/player/stores/autoplayStore';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import type { AudioPlayer } from '@/features/player/types';
import { showAlert } from '@/shared/utils/alert';

/** Browser only: a playback started before any click on the page waits for one. Native never blocks. */
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
					// play() runs inside the click: Safari unlocks sound only during the gesture itself.
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
