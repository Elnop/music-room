import { shallow } from 'zustand/shallow';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';
import type { PlayerState } from '@/features/playback/shared/player/types/playerStateTypes';

export function watchPlayerState(
	pick: (state: PlayerState) => readonly unknown[],
	onChange: (state: PlayerState) => void
): () => void {
	onChange(playerStore.getState());
	return playerStore.subscribe((state, previous) => {
		if (!shallow(pick(state), pick(previous))) onChange(state);
	});
}
