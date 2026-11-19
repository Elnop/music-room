import { Alert } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { showSuccess } from '@/shared/utils/toast';
import type { Playlist } from '@/features/playlists/types';
import { usePlaylistCardMenu } from './usePlaylistCardMenu';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/shared/services/deviceService', () => ({ getAppVersion: () => '1.0.0' }));

const mockInvalidate = jest.fn();
jest.mock('@tanstack/react-query', () => ({
	useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
}));
jest.mock('@/shared/services/authSession', () => ({
	useSession: (select: (session: object) => unknown) => select({ user: { id: 'me' } }),
}));
jest.mock('@/features/playlists/detail/hooks/useCoverActions', () => ({
	useCoverActions: () => ({ isPremium: false, change: jest.fn(), remove: jest.fn() }),
}));
const mockDelete = jest.fn();
jest.mock('@/features/playlists/hooks/usePlaylistMutations', () => ({
	useDeletePlaylist: () => ({ mutateAsync: mockDelete }),
}));
jest.mock('@/features/playlists/utils/playlistCache', () => ({ forgetPlaylist: jest.fn() }));
jest.mock('@/shared/utils/toast', () => ({ showError: jest.fn(), showSuccess: jest.fn() }));

const playlist = (id: string, ownerId: string) => ({ id, ownerId, name: `Mix ${id}` }) as Playlist;
const navigation = { navigate: jest.fn(), getParent: jest.fn() };

const setup = () => renderHook(() => usePlaylistCardMenu(navigation)).result;

beforeEach(() => {
	jest.clearAllMocks();
	jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
	mockDelete.mockResolvedValue(undefined);
});

describe('usePlaylistCardMenu', () => {
	it('has no menu for a playlist of another user', () => {
		expect(setup().current.actionsFor(playlist('p2', 'friend'))).toBeUndefined();
	});

	it('opens the menu of an owned playlist and edits it', () => {
		const result = setup();
		act(() => result.current.actionsFor(playlist('p1', 'me'))?.());
		expect(result.current.visible).toBe(true);
		expect(result.current.playlist?.id).toBe('p1');

		result.current.edit();
		expect(navigation.navigate).toHaveBeenCalledWith('CreatePlaylist', { playlistId: 'p1' });
		act(() => result.current.close());
		expect(result.current.visible).toBe(false);
	});

	it('deletes the playlist once confirmed', async () => {
		const result = setup();
		act(() => result.current.actionsFor(playlist('p1', 'me'))?.());
		result.current.remove();

		const buttons = jest.mocked(Alert.alert).mock.calls[0][2] as {
			text: string;
			onPress?: () => void;
		}[];
		await act(async () => buttons.find(button => button.text === 'Supprimer')?.onPress?.());
		expect(mockDelete).toHaveBeenCalledWith('p1');
		expect(showSuccess).toHaveBeenCalledWith('Playlist supprimée');
		expect(mockInvalidate).toHaveBeenCalled();
	});
});
