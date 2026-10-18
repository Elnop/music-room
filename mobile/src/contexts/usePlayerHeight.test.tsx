import { act, renderHook } from '@testing-library/react-native';
import { MINI_PLAYER_HEIGHT, usePlayerHeight } from '@/contexts/PlayerContext';
import { usePlayerStore } from '@/store/playerStore';
import type { SoundCloudTrack } from '@/types/soundcloud.types';

jest.mock('@/lib/supabase', () => ({
	supabase: { auth: { signOut: jest.fn(), setSession: jest.fn() } },
}));

jest.mock('@services/oauth', () => ({
	signInWithGoogle: jest.fn(),
	signInWithFacebook: jest.fn(),
}));

// The system media controls (#309) are covered by MediaSessionBridge.test.tsx.
jest.mock('@/components/player/MediaSessionBridge', () => ({ MediaSessionBridge: () => null }));

jest.mock('expo-audio', () => ({
	useAudioPlayer: jest.fn(),
	useAudioPlayerStatus: jest.fn(),
	setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/services/deviceService', () => ({
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
