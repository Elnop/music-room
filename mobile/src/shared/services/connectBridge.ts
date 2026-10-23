import type { ListeningStatus } from '@/types/listening.types';

export interface RemoteTarget {
	kind: 'remote';
	ownerId: string;
	deviceId: string;
	ownerUsername?: string;
}

export type ConnectTarget = { kind: 'local' } | RemoteTarget;

export interface ConnectSnapshot {
	target: ConnectTarget;
	remoteStatus: ListeningStatus | null;
	controlPending: boolean;
}

export interface ConnectBridge {
	useConnect: <T>(selector: (state: ConnectSnapshot) => T) => T;
	useIsLocal: () => boolean;
	getConnectState: () => ConnectSnapshot;
	setRemoteStatus: (status: ListeningStatus | null) => void;
	setControlPending: (pending: boolean) => void;
	setLocal: (message?: string) => void;
	setRemote: (target: Omit<RemoteTarget, 'kind'>) => void;
}

const DEFAULT_TARGET: ConnectTarget = { kind: 'local' };
const DEFAULT_STATE: ConnectSnapshot = {
	target: DEFAULT_TARGET,
	remoteStatus: null,
	controlPending: false,
};

const defaultBridge: ConnectBridge = {
	useConnect: selector => selector(DEFAULT_STATE),
	useIsLocal: () => true,
	getConnectState: () => DEFAULT_STATE,
	setRemoteStatus: () => undefined,
	setControlPending: () => undefined,
	setLocal: () => undefined,
	setRemote: () => undefined,
};

let currentBridge: ConnectBridge = defaultBridge;

export function registerConnectBridge(bridge: ConnectBridge): void {
	currentBridge = bridge;
}

export function resetConnectBridge(): void {
	currentBridge = defaultBridge;
}

export function getConnectBridge(): ConnectBridge {
	return currentBridge;
}

export function useConnectStoreSelector<T>(selector: (state: ConnectSnapshot) => T): T {
	return currentBridge.useConnect(selector);
}

export function useIsLocalTarget(): boolean {
	return currentBridge.useIsLocal();
}

export function isLocalTarget(): boolean {
	return currentBridge.getConnectState().target.kind === 'local';
}

export function setRemoteStatus(status: ListeningStatus | null): void {
	currentBridge.setRemoteStatus(status);
}

export function setControlPending(pending: boolean): void {
	currentBridge.setControlPending(pending);
}
