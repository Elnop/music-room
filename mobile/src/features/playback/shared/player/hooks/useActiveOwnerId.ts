import { useStore } from 'zustand';
import { sessionStore } from '@/shared/backend/lib/authSession';
import { useConnectState } from '@/features/playback/shared/player/hooks/useConnectState';

export function useActiveOwnerId(): string | null {
	const remoteOwnerId = useConnectState(state =>
		state.target.kind === 'remote' ? state.target.ownerId : null
	);
	const userId = useStore(sessionStore(), state => state?.user?.id ?? null);
	return remoteOwnerId ?? userId;
}
