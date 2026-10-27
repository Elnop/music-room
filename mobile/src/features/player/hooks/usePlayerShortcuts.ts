import { usePlaybackControls } from '@/features/player/hooks/usePlaybackControls';
import { SEEK_STEP_S } from '@/features/player/constants';
import type { KeyboardShortcut } from '@/shared/utils/keyboardShortcuts';

/** The keyboard transport, under the rules of the player's buttons: a remote device is never seeked. */
export function usePlayerShortcuts(): KeyboardShortcut[] {
	const controls = usePlaybackControls();
	const seek = (action: 'increment' | 'decrement') => {
		if (!controls.sliderDisabled) controls.handleSliderAction(action);
	};

	return [
		{
			key: ' ',
			keys: 'Espace',
			description: 'Lecture / pause',
			run: () => {
				if (!controls.playDisabled) controls.handlePlayPause();
			},
		},
		{
			key: 'ArrowLeft',
			shift: false,
			keys: '←',
			description: `Reculer de ${SEEK_STEP_S} secondes`,
			run: () => seek('decrement'),
		},
		{
			key: 'ArrowRight',
			shift: false,
			keys: '→',
			description: `Avancer de ${SEEK_STEP_S} secondes`,
			run: () => seek('increment'),
		},
		{
			key: 'ArrowLeft',
			shift: true,
			keys: 'Maj + ←',
			description: 'Titre précédent',
			run: controls.handlePrevious,
		},
		{
			key: 'ArrowRight',
			shift: true,
			keys: 'Maj + →',
			description: 'Titre suivant',
			run: controls.handleNext,
		},
	];
}
