import { Platform } from 'react-native';
import { BREAKPOINTS, PLAYER_DIALOG_WIDTH } from '@/shared/theme/configs/layoutConfig';
import { ARTWORK_GAP } from '@/features/playback/features/player-modal/playerModalConfig';

export function isPlayerDialog(windowWidth: number): boolean {
	return Platform.OS === 'web' && windowWidth >= BREAKPOINTS.tablet;
}

export function artworkSize(windowWidth: number, windowHeight: number) {
	const playerWidth = isPlayerDialog(windowWidth) ? PLAYER_DIALOG_WIDTH : windowWidth;
	const size = Math.min(playerWidth * 0.75, windowHeight * 0.36);
	return { size, step: size + ARTWORK_GAP };
}
