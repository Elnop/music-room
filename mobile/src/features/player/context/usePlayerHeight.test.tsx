import { act, renderHook } from '@testing-library/react-native';
import { MINI_PLAYER_HEIGHT, usePlayerHeight } from './PlayerContext';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import type { SoundCloudTrack } from '@/types/soundcloud.types';

// The system media controls are covered by MediaSessionBridge.test.tsx.
jest.mock('@/features/player/mediaSession/components/orchestrators/MediaSessionBridge', () => ({
	MediaSessionBridge: () => null,
}));

jest.mock('expo-audio', () => ({
	useAudioPlayer: jest.fn(),
	useAudioPlayerStatus: jest.fn(),
	setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/shared/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

const track: SoundCloudTrack = {
	id: 99,
	title: 'Tapped',
	description: null,
	duration: 1000,
	genre: null,
	artwork_url: null,
	permalink_url: 'https://soundcloud.com/artist/tapped',
	user: { id: 1, username: 'x', avatar_url: null, permalink_url: '' },
	playable: true,
};

describe('usePlayerHeight', () => {
	it('reserves the mini-player height with and without a track', () => {
		usePlayerStore.setState({ currentTrack: null });
		const { result } = renderHook(() => usePlayerHeight());
		expect(result.current).toBe(MINI_PLAYER_HEIGHT);
		act(() => usePlayerStore.setState({ currentTrack: track }));
		expect(result.current).toBe(MINI_PLAYER_HEIGHT);
	});
});
