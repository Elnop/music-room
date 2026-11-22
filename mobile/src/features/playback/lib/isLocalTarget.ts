import { connectStore } from '@/features/playback/shared/player/stores/connectStore';

export function isLocalTarget(): boolean {
	return connectStore.getState().target.kind === 'local';
}
