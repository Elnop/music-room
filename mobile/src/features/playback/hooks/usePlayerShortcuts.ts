import { usePlaybackControls } from '@/features/playback/shared/player/hooks/usePlaybackControls';
import { SEEK_STEP_S } from '@/features/playback/shared/player/configs/playerConfig';
import type { KeyboardShortcut } from '@/shared/keyboard-shortcuts/keyboardShortcutTypes';

type PlaybackControls = ReturnType<typeof usePlaybackControls>;

function seekShortcuts(controls: PlaybackControls): KeyboardShortcut[] {
	function seek(action: 'increment' | 'decrement') {
		if (!controls.sliderDisabled) controls.handleSliderAction(action);
	}
	return [
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
	];
}

function trackShortcuts(controls: PlaybackControls): KeyboardShortcut[] {
	return [
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

export function usePlayerShortcuts(): KeyboardShortcut[] {
	const controls = usePlaybackControls();
	return [
		{
			key: ' ',
			keys: 'Espace',
			description: 'Lecture / pause',
			run: () => {
				if (!controls.playDisabled) controls.handlePlayPause();
			},
		},
		...seekShortcuts(controls),
		...trackShortcuts(controls),
	];
}
