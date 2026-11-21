import { create } from 'zustand';
import { getSession, useSession, onSessionEnd } from '@/shared/backend/lib/authSession';
import { showInfo } from '@/shared/theme/lib/toast';
import type {
	ConnectTarget,
	ListeningStatus,
	RemoteTarget,
} from '@/features/playback/shared/player/lib/queue.types';
import { usePlayerStore } from '@/features/playback/shared/player/stores/playerStore';

type ConnectState = {
	target: ConnectTarget;
	remoteStatus: ListeningStatus | null;
	controlPending: boolean;
	setRemote: (target: Omit<RemoteTarget, 'kind'>) => void;
	setLocal: (message?: string) => void;
	setRemoteStatus: (status: ListeningStatus | null) => void;
	setControlPending: (pending: boolean) => void;
};

const LOCAL: ConnectTarget = { kind: 'local' };

export const useConnectStore = create<ConnectState>((set, get) => ({
	target: LOCAL,
	remoteStatus: null,
	controlPending: false,

	setRemote: ({ ownerId, deviceId, ownerUsername }) => {
		const { target } = get();
		if (target.kind === 'remote' && target.ownerId === ownerId && target.deviceId === deviceId) {
			if (ownerUsername !== undefined && ownerUsername !== target.ownerUsername) {
				set({ target: { ...target, ownerUsername } });
			}
			return;
		}
		usePlayerStore.getState().stop();
		set({
			target: { kind: 'remote', ownerId, deviceId, ownerUsername },
			remoteStatus: null,
			controlPending: false,
		});
	},

	setLocal: message => {
		set({ target: LOCAL, remoteStatus: null, controlPending: false });
		if (message) showInfo(message);
	},

	setRemoteStatus: status => {
		set({ remoteStatus: status });
	},

	setControlPending: pending => {
		set({ controlPending: pending });
	},
}));

export function isLocalTarget(): boolean {
	return useConnectStore.getState().target.kind === 'local';
}

export function useIsLocalTarget(): boolean {
	return useConnectStore(state => state.target.kind === 'local');
}

export function activeOwnerId(): string | null {
	const { target } = useConnectStore.getState();
	return target.kind === 'remote' ? target.ownerId : (getSession().user?.id ?? null);
}

export function useActiveOwnerId(): string | null {
	const remoteOwnerId = useConnectStore(state =>
		state.target.kind === 'remote' ? state.target.ownerId : null
	);
	const userId = useSession(state => state?.user?.id ?? null);
	return remoteOwnerId ?? userId;
}

onSessionEnd(() => {
	useConnectStore.setState({ target: LOCAL, remoteStatus: null, controlPending: false });
});
