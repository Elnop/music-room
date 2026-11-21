import { Alert } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { showSuccess } from '@/shared/theme/lib/toast';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import type { Playlist } from '@/features/playlists/shared/playlist/playlistTypes';
import { usePlaylistCardMenu } from '@/features/playlists/features/editor/features/card-menu/hooks/usePlaylistCardMenu';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/shared/backend/deviceService', () => ({ getAppVersion: () => '1.0.0' }));

const mockInvalidate = jest.fn();
jest.mock('@tanstack/react-query', () => ({
	useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
}));
jest.mock('@/shared/backend/hooks/useSession', () => ({
	useSession: (select: (session: object) => unknown) => select({ user: { id: 'me' } }),
}));
jest.mock(
	'@/features/playlists/features/editor/shared/playlist-mutations/hooks/useCoverActions',
	() => ({
		useCoverActions: () => ({ isPremium: false, change: jest.fn(), remove: jest.fn() }),
	})
);
const mockDelete = jest.fn();
jest.mock(
	'@/features/playlists/features/editor/shared/playlist-mutations/hooks/usePlaylistMutations',
	() => ({
		useDeletePlaylist: () => ({ mutateAsync: mockDelete }),
	})
);
jest.mock(
	'@/features/playlists/features/editor/shared/playlist-mutations/lib/playlistCacheEdits',
	() => ({
		forgetPlaylist: jest.fn(),
	})
);
jest.mock('@/shared/theme/lib/toast', () => ({ showError: jest.fn(), showSuccess: jest.fn() }));

function playlist(id: string, ownerId: string) {
	return { id, ownerId, name: `Mix ${id}` } as Playlist;
}
const navigation = { navigate: jest.fn(), getParent: jest.fn() };

function setup() {
	return renderHook(() => usePlaylistCardMenu(navigation, { isPremium: true, refetch: jest.fn() }))
		.result;
}

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
		expect(result.current.sheet?.playlistName).toBe('Mix p1');

		result.current.sheet?.onEdit();
		expect(navigation.navigate).toHaveBeenCalledWith('CreatePlaylist', { playlistId: 'p1' });
		act(() => result.current.close());
		expect(result.current.visible).toBe(false);
	});

	it('deletes the playlist once confirmed', async () => {
		const result = setup();
		act(() => result.current.actionsFor(playlist('p1', 'me'))?.());
		result.current.sheet?.onDelete();

		const buttons = jest.mocked(Alert.alert).mock.calls[0][2] as {
			text: string;
			onPress?: () => void;
		}[];
		const confirm = buttons.find(button => button.text === 'Supprimer');
		await act(async () => confirm?.onPress?.());
		expect(mockDelete).toHaveBeenCalledWith('p1');
		expect(showSuccess).toHaveBeenCalledWith('Playlist supprimée');
		expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: queryKeys.playlists.public() });
	});
});
