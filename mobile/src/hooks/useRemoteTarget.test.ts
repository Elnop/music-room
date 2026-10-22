import { act, renderHook } from '@testing-library/react-native';
import { useRemoteTarget } from './useRemoteTarget';
import { useConnectStore } from '@/store/connectStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { showError, showInfo } from '@/shared/utils/toast';
import type { ListeningStatus, UserListeningStatus } from '@/types/listening.types';
import type { UserProfile } from '@/types/user.types';
import { logger } from '@/shared/utils/logger';

const mockSocket = {
	connected: true,
	on: jest.fn(),
	off: jest.fn(),
	emit: jest.fn(),
};
const mockSocketState = { socket: mockSocket, isConnected: true };
const mockLoad = jest.fn();
const mockForget = jest.fn();

jest.mock('@/shared/stores/socketStore', () => ({
	useSocketStore: (selector: (state: typeof mockSocketState) => unknown) =>
		selector(mockSocketState),
}));

jest.mock('@/store/queueStore', () => ({
	useQueueStore: { getState: () => ({ load: mockLoad, forget: mockForget }) },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);


jest.mock('@/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
	deviceService: { getDeviceInfo: jest.fn() },
}));

jest.mock('@/shared/utils/toast', () => ({
	showInfo: jest.fn(),
	showError: jest.fn(),
	showSuccess: jest.fn(),
}));

const deviceStatus = (deviceId: string): ListeningStatus => ({
	ownerId: 'friend',
	device: { deviceId, deviceName: 'Tablette', platform: 'android', model: 'Tab' },
	track: { id: 1, title: 'Song', artist: 'Artist', artworkUrl: null },
	isPlaying: true,
	positionMs: 1000,
	updatedAt: '2026-10-15T00:00:00Z',
});

/** Last handler registered on the socket for an event. */
const handler = <T>(event: string) => {
	const calls = mockSocket.on.mock.calls.filter(call => call[0] === event);
	return calls[calls.length - 1]?.[1] as (data: T) => void;
};

const connect = () => useConnectStore.getState();

beforeEach(() => {
	jest.clearAllMocks();
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	useAuthStore.setState({ user: { id: 'me' } as UserProfile, isAuthenticated: true });
	useConnectStore.setState({
		target: { kind: 'local' },
		remoteStatus: null,
		controlPending: false,
	});
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('useRemoteTarget', () => {
	it('does nothing in local mode', () => {
		renderHook(() => useRemoteTarget());
		expect(mockSocket.emit).not.toHaveBeenCalled();
		expect(mockLoad).not.toHaveBeenCalled();
	});

	it('subscribes to the friend, loads their queue, then unsubscribes and forgets it', () => {
		renderHook(() => useRemoteTarget());
		act(() => connect().setRemote({ ownerId: 'friend', deviceId: 'tablet' }));

		expect(mockSocket.emit).toHaveBeenCalledWith('listening:subscribe', 'friend');
		expect(mockLoad).toHaveBeenCalledWith('friend');

		act(() => connect().setLocal());
		expect(mockSocket.emit).toHaveBeenCalledWith('listening:unsubscribe', 'friend');
		expect(mockForget).toHaveBeenCalledWith('friend');
	});

	it('keeps my own queue when driving one of my devices', () => {
		renderHook(() => useRemoteTarget());
		act(() => connect().setRemote({ ownerId: 'me', deviceId: 'tablet' }));
		expect(mockSocket.emit).toHaveBeenCalledWith('listening:subscribe', 'me');
		act(() => connect().setLocal());
		expect(mockLoad).not.toHaveBeenCalled();
		expect(mockForget).not.toHaveBeenCalled();
	});

	it("keeps the targeted device's status and ignores other owners", () => {
		renderHook(() => useRemoteTarget());
		act(() => connect().setRemote({ ownerId: 'friend', deviceId: 'tablet' }));
		const onStatus = handler<UserListeningStatus>('listening:status');

		act(() => onStatus({ ownerId: 'stranger', devices: [] }));
		expect(connect().target.kind).toBe('remote');

		const tablet = deviceStatus('tablet');
		act(() => onStatus({ ownerId: 'friend', devices: [deviceStatus('phone'), tablet] }));
		expect(connect().remoteStatus).toBe(tablet);
	});

	it('goes back to local when the device leaves the status', () => {
		renderHook(() => useRemoteTarget());
		act(() => connect().setRemote({ ownerId: 'friend', deviceId: 'tablet' }));
		act(() =>
			handler<UserListeningStatus>('listening:status')({
				ownerId: 'friend',
				devices: [deviceStatus('phone')],
			})
		);
		expect(connect().target).toEqual({ kind: 'local' });
		expect(showInfo).toHaveBeenCalledWith('Appareil hors ligne');
	});

	it('goes back to local on control:revoked for that owner only', () => {
		renderHook(() => useRemoteTarget());
		act(() => connect().setRemote({ ownerId: 'friend', deviceId: 'tablet' }));
		const onRevoked = handler<{ ownerId: string }>('control:revoked');

		act(() => onRevoked({ ownerId: 'other' }));
		expect(connect().target.kind).toBe('remote');

		act(() => onRevoked({ ownerId: 'friend' }));
		expect(connect().target).toEqual({ kind: 'local' });
		expect(showInfo).toHaveBeenCalledWith('Accès retiré');
	});

	it('toasts the control:error answering its own play / pause only', () => {
		renderHook(() => useRemoteTarget());
		act(() => connect().setRemote({ ownerId: 'friend', deviceId: 'tablet' }));
		const onError = handler<{ code: string; message: string }>('control:error');
		const offline = { code: 'DEVICE_OFFLINE', message: 'offline' };

		// A device card of the friend profile, not the remote target.
		act(() => onError(offline));
		expect(showError).not.toHaveBeenCalled();

		act(() => connect().setControlPending(true));
		act(() => onError(offline));
		expect(showError).toHaveBeenCalledWith("Cet appareil n'est plus en ligne");
		expect(connect().controlPending).toBe(false);
	});

	it('clears the pending action on its control:success', () => {
		renderHook(() => useRemoteTarget());
		act(() => connect().setRemote({ ownerId: 'friend', deviceId: 'tablet' }));
		act(() => connect().setControlPending(true));
		act(() =>
			handler<{ targetUserId: string; targetDeviceId: string }>('control:success')({
				targetUserId: 'friend',
				targetDeviceId: 'tablet',
			})
		);
		expect(connect().controlPending).toBe(false);
	});

	it('goes back to local when the subscription is refused', () => {
		renderHook(() => useRemoteTarget());
		act(() => connect().setRemote({ ownerId: 'friend', deviceId: 'tablet' }));
		act(() =>
			handler<{ code: string; message: string }>('listening:error')({
				code: 'NOT_AUTHORIZED',
				message: 'no',
			})
		);
		expect(connect().target).toEqual({ kind: 'local' });
		expect(showInfo).toHaveBeenCalledWith('Accès refusé à cet appareil');
	});

	it('shares the listening room with another holder', () => {
		const { acquireListening, releaseListening } = jest.requireActual('@/services/listeningRooms');
		acquireListening(mockSocket, 'friend'); // the friend profile
		mockSocket.emit.mockClear();
		renderHook(() => useRemoteTarget());
		act(() => connect().setRemote({ ownerId: 'friend', deviceId: 'tablet' }));
		act(() => connect().setLocal());
		expect(mockSocket.emit).not.toHaveBeenCalledWith('listening:subscribe', 'friend');
		expect(mockSocket.emit).not.toHaveBeenCalledWith('listening:unsubscribe', 'friend');
		releaseListening(mockSocket, 'friend');
		expect(mockSocket.emit).toHaveBeenCalledWith('listening:unsubscribe', 'friend');
	});
});
