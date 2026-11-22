import { showAlert } from '@/shared/alerts/showAlert';
import { autoplayStore } from '@/features/playback/autoplayStore';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';

export function showAutoplayPrompt(play: () => void): void {
	const { setBlocked } = autoplayStore.getState();
	const title = playerStore.getState().currentTrack?.title;
	showAlert(
		'Cliquer pour activer le son',
		title ? `Le navigateur attend un clic pour lire « ${title} ».` : '',
		[
			{ text: 'Plus tard', style: 'cancel', onPress: () => setBlocked(false) },
			{
				text: 'Activer le son',
				onPress: () => {
					play();
					setBlocked(false);
					playerStore.getState().resume();
				},
			},
		],
	);
}
