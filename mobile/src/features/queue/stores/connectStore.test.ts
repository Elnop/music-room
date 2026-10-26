import { createStore } from 'zustand';
import { activeOwnerId, useConnectStore } from './connectStore';
import {
	registerAuthSession,
	notifySessionEnd,
	type SessionView,
} from '@/shared/services/authSession';
import { registerPlaybackBridge } from '@/shared/services/playbackBridge';
import { showInfo } from '@/shared/utils/toast';
import type { ListeningStatus } from '@/types/listening.types';
import type { UserProfile } from '@/types/user.types';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/shared/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('@/shared/utils/toast', () => ({
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

registerPlaybackBridge({
	usePlaylistPlayback: () => ({ playingUri: null, state: null }),
	useActiveQueue: () => ({ currentItemId: null, items: [], version: 0 }),
	addToQueue: jest.fn(async () => true),
	playNext: jest.fn(async () => true),
	playPlaylist: jest.fn(async () => 'played'),
	next: jest.fn(async () => 'played'),
	previous: jest.fn(async () => 'played'),
	playListTrack: jest.fn(async () => undefined),
	playTrack: jest.fn(),
	pause: jest.fn(),
	resume: jest.fn(),
	stop: mockStop,
	getPlayerState: () => ({
		currentTrack: null,
		queueItemId: null,
		loadCounter: 0,
		positionMs: 0,
	}),
});

const connect = () => useConnectStore.getState();

beforeEach(() => {
	jest.clearAllMocks();
	useConnectStore.setState({ target: { kind: 'local' }, remoteStatus: null });
	testSessionStore.setState({ user: { id: 'me' } as UserProfile, isAuthenticated: true });
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('connectStore', () => {
	it('starts local', () => {
		expect(connect().target).toEqual({ kind: 'local' });
		expect(activeOwnerId()).toBe('me');
	});

	it('setRemote targets the device and stops the phone audio', () => {
		connect().setRemote({ ownerId: 'friend', deviceId: 'tablet', ownerUsername: 'Léa' });

		expect(connect().target).toEqual({
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
		expect(connect().target).toEqual({ kind: 'local' });
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
		expect(connect().target).toEqual({ kind: 'local' });
		expect(connect().remoteStatus).toBeNull();
	});
});
