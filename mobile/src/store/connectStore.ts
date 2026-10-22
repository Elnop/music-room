import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { usePlayerStore } from './playerStore';
import { showInfo } from '@/shared/utils/toast';
import type { ListeningStatus } from '@/types/listening.types';

/** A device of mine or of a friend that this phone drives as a remote (#297). */
interface RemoteTarget {
	kind: 'remote';
	ownerId: string;
	deviceId: string;
	/** Owner's username, for « Sur Tablette de Léa »; `listening:status` does not carry it. */
	ownerUsername?: string;
}

/** Where the player acts: this phone's audio, or another device. */
type ConnectTarget = { kind: 'local' } | RemoteTarget;

interface ConnectState {
	target: ConnectTarget;
	/** Last listening status of the targeted device; null in local mode or before the first one. */
	remoteStatus: ListeningStatus | null;
	/**
	 * A play / pause sent to the target awaits its `control:success` /
	 * `control:error`. `control:error` names no device, so this tells the remote
	 * target's errors from those of the friend profile's device cards.
	 */
	controlPending: boolean;
	/** Drive another device: the phone stops its own audio. */
	setRemote: (target: Omit<RemoteTarget, 'kind'>) => void;
	/** Back to this phone's audio; `message` is shown as an info toast. */
	setLocal: (message?: string) => void;
	setRemoteStatus: (status: ListeningStatus | null) => void;
	setControlPending: (pending: boolean) => void;
}

const LOCAL: ConnectTarget = { kind: 'local' };

/**
 * Active device of the player (Spotify Connect style, #297). `local` at
 * startup and after logout. Switching to remote is exposed here only; the
 * device picker is #298. `useRemoteTarget` follows the targeted device.
 */
export const useConnectStore = create<ConnectState>((set, get) => ({
	target: LOCAL,
	remoteStatus: null,
	controlPending: false,

	setRemote: ({ ownerId, deviceId, ownerUsername }) => {
		const { target } = get();
		// Re-selecting the current target keeps its status and subscription.
		if (target.kind === 'remote' && target.ownerId === ownerId && target.deviceId === deviceId) {
			if (ownerUsername !== undefined && ownerUsername !== target.ownerUsername) {
				set({ target: { ...target, ownerUsername } });
			}
			return;
		}
		// In remote mode the phone plays no audio.
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

/** The owner whose queue the player shows and acts on: the remote owner, else me. */
export function activeOwnerId(): string | null {
	const { target } = useConnectStore.getState();
	return target.kind === 'remote' ? target.ownerId : (useAuthStore.getState().user?.id ?? null);
}

/** Reactive `activeOwnerId`. */
export function useActiveOwnerId(): string | null {
	const remoteOwnerId = useConnectStore(state =>
		state.target.kind === 'remote' ? state.target.ownerId : null
	);
	const userId = useAuthStore(state => state.user?.id ?? null);
	return remoteOwnerId ?? userId;
}

/** Every end of session drops the remote target. */
useAuthStore.subscribe((state, previous) => {
	if (previous.isAuthenticated && !state.isAuthenticated) {
		useConnectStore.setState({ target: LOCAL, remoteStatus: null, controlPending: false });
	}
});
