import { createStore } from 'zustand';
import {
	activeOwnerId,
	useConnectStore,
} from '@/features/playback/shared/player/stores/connectStore';
import { registerAuthSession } from '@/shared/backend/lib/authSession';
import { notifySessionEnd } from '@/shared/backend/lib/sessionEnd';
import type { SessionView } from '@/shared/backend/types/sessionTypes';
import { usePlayerStore } from '@/features/playback/shared/player/stores/playerStore';
import { showInfo } from '@/shared/theme/lib/toast';
import type { ListeningStatus } from '@/features/playback/shared/player/lib/listening.types';
import type { UserProfile } from '@/shared/users/userTypes';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/shared/backend/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('@/shared/theme/lib/toast', () => ({
	showInfo: jest.fn(),
	showError: jest.fn(),
	showSuccess: jest.fn(),
}));

const status: ListeningStatus = {
	ownerId: 'friend',
	device: { deviceId: 'tablet', deviceName: 'Tablette', platform: 'android', model: 'Tab' },
	track: null,
	isPlaying: false,
	positionMs: 0,
	updatedAt: '2026-10-15T00:00:00Z',
};

const testSessionStore = createStore<SessionView>(() => ({
	user: { id: 'me' } as UserProfile,
	accessToken: 'test-token',
	isAuthenticated: true,
}));

registerAuthSession({
	store: testSessionStore,
	isTokenExpiringSoon: () => false,
	refreshAccessToken: async () => true,
});

const mockStop = jest.fn();

function connect() {
	return useConnectStore.getState();
}

beforeEach(() => {
	jest.clearAllMocks();
	usePlayerStore.setState({ stop: mockStop });
	useConnectStore.setState({ target: { kind: 'local' }, remoteStatus: null });
	testSessionStore.setState({ user: { id: 'me' } as UserProfile, isAuthenticated: true });
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('connectStore', () => {
	it('starts local', () => {
		expect(connect().target).toStrictEqual({ kind: 'local' });
		expect(activeOwnerId()).toBe('me');
	});

	it('setRemote targets the device and stops the phone audio', () => {
		connect().setRemote({ ownerId: 'friend', deviceId: 'tablet', ownerUsername: 'Léa' });

		expect(connect().target).toStrictEqual({
			kind: 'remote',
			ownerId: 'friend',
			deviceId: 'tablet',
			ownerUsername: 'Léa',
		});
		expect(activeOwnerId()).toBe('friend');
		expect(mockStop).toHaveBeenCalledTimes(1);
	});

	it('setLocal drops the status and toasts a message when given one', () => {
		connect().setRemote({ ownerId: 'friend', deviceId: 'tablet' });
		connect().setRemoteStatus(status);
		connect().setLocal();
		expect(connect().target).toStrictEqual({ kind: 'local' });
		expect(connect().remoteStatus).toBeNull();
		expect(showInfo).not.toHaveBeenCalled();

		connect().setRemote({ ownerId: 'friend', deviceId: 'tablet' });
		connect().setLocal('Accès retiré');
		expect(showInfo).toHaveBeenCalledWith('Accès retiré');
	});

	it('keeps the status when the current target is selected again', () => {
		connect().setRemote({ ownerId: 'friend', deviceId: 'tablet' });
		connect().setRemoteStatus(status);
		mockStop.mockClear();
		connect().setRemote({ ownerId: 'friend', deviceId: 'tablet', ownerUsername: 'Léa' });
		expect(connect().remoteStatus).toBe(status);
		expect(connect().target).toMatchObject({ ownerUsername: 'Léa' });
		expect(mockStop).not.toHaveBeenCalled();
	});

	it('goes back to local on logout', () => {
		connect().setRemote({ ownerId: 'friend', deviceId: 'tablet' });
		connect().setRemoteStatus(status);
		notifySessionEnd();
		expect(connect().target).toStrictEqual({ kind: 'local' });
		expect(connect().remoteStatus).toBeNull();
	});
});
