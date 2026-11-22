import { createStore } from 'zustand';
import { onSessionEnd } from '@/shared/backend/lib/sessionEnd';
import { showInfo } from '@/shared/theme/lib/toast';
import { LOCAL_TARGET } from '@/features/playback/shared/player/configs/playerConfig';
import { selectRemote } from '@/features/playback/shared/player/lib/selectRemote';
import type { ConnectState } from '@/features/playback/shared/player/types/queueTypes';

export const connectStore = createStore<ConnectState>((set, get) => ({
	target: LOCAL_TARGET,
	remoteStatus: null,
	controlPending: false,
	setRemote: (remote) => selectRemote(set, get, remote),
	setLocal: (message) => {
		set({ target: LOCAL_TARGET, remoteStatus: null, controlPending: false });
		if (message) showInfo(message);
	},
	setRemoteStatus: (status) => {
		set({ remoteStatus: status });
	},
	setControlPending: (pending) => {
		set({ controlPending: pending });
	},
}));

onSessionEnd(() => {
	connectStore.setState({ target: LOCAL_TARGET, remoteStatus: null, controlPending: false });
});
