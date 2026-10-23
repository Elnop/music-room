import { create } from 'zustand';
import { getSession, useSession, onSessionEnd } from '@/shared/services/authSession';
import { getPlayback } from '@/shared/services/playbackBridge';
import { showInfo } from '@/shared/utils/toast';
import type { ConnectTarget, ListeningStatus, RemoteTarget } from '@/features/queue/types';

interface ConnectState {
	target: ConnectTarget;
	remoteStatus: ListeningStatus | null;
	controlPending: boolean;
	setRemote: (target: Omit<RemoteTarget, 'kind'>) => void;
	setLocal: (message?: string) => void;
	setRemoteStatus: (status: ListeningStatus | null) => void;
	setControlPending: (pending: boolean) => void;
}

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
		getPlayback().stop();
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
