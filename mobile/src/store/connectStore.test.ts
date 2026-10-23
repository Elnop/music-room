import { activeOwnerId, useConnectStore } from './connectStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { showInfo } from '@/shared/utils/toast';
import type { ListeningStatus } from '@/types/listening.types';
import type { SoundCloudTrack } from '@/types/soundcloud.types';
import type { UserProfile } from '@/types/user.types';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('@/shared/utils/toast', () => ({
	showInfo: jest.fn(),
	showError: jest.fn(),
	showSuccess: jest.fn(),
}));

const track: SoundCloudTrack = {
	id: 1,
	title: 'Song',
	description: null,
	duration: 1000,
	genre: null,
	artwork_url: null,
	permalink_url: 'https://soundcloud.com/artist/song',
	user: { id: 1, username: 'x', avatar_url: null, permalink_url: '' },
	playable: true,
};

const status: ListeningStatus = {
	ownerId: 'friend',
	device: { deviceId: 'tablet', deviceName: 'Tablette', platform: 'android', model: 'Tab' },
	track: null,
	isPlaying: false,
	positionMs: 0,
	updatedAt: '2026-10-15T00:00:00Z',
};

const connect = () => useConnectStore.getState();

beforeEach(() => {
	jest.clearAllMocks();
	useConnectStore.setState({ target: { kind: 'local' }, remoteStatus: null });
	useAuthStore.setState({ user: { id: 'me' } as UserProfile, isAuthenticated: true });
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
		usePlayerStore.getState().playTrack(track);
		connect().setRemote({ ownerId: 'friend', deviceId: 'tablet', ownerUsername: 'Léa' });

		expect(connect().target).toEqual({
			kind: 'remote',
			ownerId: 'friend',
			deviceId: 'tablet',
			ownerUsername: 'Léa',
		});
		expect(activeOwnerId()).toBe('friend');
		expect(usePlayerStore.getState().currentTrack).toBeNull();
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
		usePlayerStore.getState().playTrack(track);
		connect().setRemote({ ownerId: 'friend', deviceId: 'tablet', ownerUsername: 'Léa' });
		expect(connect().remoteStatus).toBe(status);
		expect(connect().target).toMatchObject({ ownerUsername: 'Léa' });
		expect(usePlayerStore.getState().currentTrack).toBe(track);
	});

	it('goes back to local on logout', () => {
		connect().setRemote({ ownerId: 'friend', deviceId: 'tablet' });
		connect().setRemoteStatus(status);
		useAuthStore.setState({ isAuthenticated: false, user: null });
		expect(connect().target).toEqual({ kind: 'local' });
		expect(connect().remoteStatus).toBeNull();
	});
});
