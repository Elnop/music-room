import {
	registerConnectBridge,
	resetConnectBridge,
	getConnectBridge,
	useConnectStoreSelector,
	useIsLocalTarget,
	isLocalTarget,
	setRemoteStatus,
	setControlPending,
	type ConnectBridge,
	type ConnectSnapshot,
} from './connectBridge';

describe('connectBridge', () => {
	beforeEach(() => {
		resetConnectBridge();
	});

	it('returns default local values when unregistered', () => {
		expect(isLocalTarget()).toBe(true);
		expect(useIsLocalTarget()).toBe(true);
		expect(useConnectStoreSelector(s => s.target)).toEqual({ kind: 'local' });
		expect(getConnectBridge().getConnectState().remoteStatus).toBeNull();
		expect(getConnectBridge().getConnectState().controlPending).toBe(false);
	});

	it('delegates to registered implementation', () => {
		const state: ConnectSnapshot = {
			target: { kind: 'remote', ownerId: 'u1', deviceId: 'd1' },
			remoteStatus: null,
			controlPending: true,
		};
		const mockBridge: ConnectBridge = {
			useConnect: selector => selector(state),
			useIsLocal: () => state.target.kind === 'local',
			getConnectState: () => state,
			setRemoteStatus: jest.fn(),
			setControlPending: jest.fn(),
			setLocal: jest.fn(),
			setRemote: jest.fn(),
		};

		registerConnectBridge(mockBridge);

		expect(isLocalTarget()).toBe(false);
		expect(useIsLocalTarget()).toBe(false);
		expect(useConnectStoreSelector(s => s.controlPending)).toBe(true);

		setControlPending(false);
		expect(mockBridge.setControlPending).toHaveBeenCalledWith(false);

		setRemoteStatus(null);
		expect(mockBridge.setRemoteStatus).toHaveBeenCalledWith(null);
	});
});
