import { RESTART_THRESHOLD_S } from '@/features/playback/shared/player/configs/playerConfig';

export function previousAction(currentTime: number, hasPrevious: boolean): 'restart' | 'previous' {
	return currentTime > RESTART_THRESHOLD_S || !hasPrevious ? 'restart' : 'previous';
}
