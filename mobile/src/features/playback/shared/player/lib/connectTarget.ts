import { getSession } from '@/shared/backend/lib/authSession';
import { connectStore } from '@/features/playback/shared/player/stores/connectStore';

export function isLocalTarget(): boolean {
	return connectStore.getState().target.kind === 'local';
}

export function activeOwnerId(): string | null {
	const { target } = connectStore.getState();
	return target.kind === 'remote' ? target.ownerId : (getSession().user?.id ?? null);
}
