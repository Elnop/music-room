import { Alert } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useCoverActions } from './useCoverActions';
import { ApiError } from '@/shared/services/api';
import { showError, showSuccess } from '@/shared/utils/toast';
import * as playlistApi from '@/features/playlists/services/playlistApi';
import { patchPlaylist } from '@/features/playlists/utils/playlistCache';
import type { DetailNavigation } from './usePlaylistDetailScreen';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/shared/services/deviceService', () => ({ getAppVersion: () => '1.0.0' }));
jest.mock('@tanstack/react-query', () => ({ useQueryClient: jest.fn(() => ({})) }));

const mockPlan = { isPremium: true, refetch: jest.fn() };
jest.mock('@/shared/hooks/usePlan', () => ({ usePlan: () => mockPlan }));

const mockPickImage = jest.fn();
jest.mock('@/shared/utils/imagePicker', () => ({
	pickImage: (...args: unknown[]) => mockPickImage(...args),
}));
jest.mock('@/shared/utils/squareImage', () => ({
	prepareSquareImage: () => Promise.resolve('file:///cover-512.jpg'),
}));
jest.mock('@/features/playlists/services/playlistApi', () => ({
	uploadCover: jest.fn(),
	removeCover: jest.fn(),
}));
jest.mock('@/features/playlists/utils/playlistCache', () => ({ patchPlaylist: jest.fn() }));
jest.mock('@/shared/utils/toast', () => ({ showError: jest.fn(), showSuccess: jest.fn() }));

const ID = 'p1';
const COVER = 'https://x/storage/v1/object/public/playlist-covers/p1/c.jpg';
const parentNavigate = jest.fn();
const navigation = {
	getParent: () => ({ navigate: parentNavigate }),
} as unknown as DetailNavigation;

function setup() {
	return renderHook(() => useCoverActions(navigation, ID, true)).result;
}

/** The buttons of the last Alert. */
const alertButtons = () =>
	(jest.mocked(Alert.alert).mock.calls.at(-1)?.[2] ?? []) as {
		text: string;
		onPress?: () => void;
	}[];

beforeEach(() => {
	jest.clearAllMocks();
	jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
	mockPlan.isPremium = true;
	mockPickImage.mockResolvedValue({ uri: 'file:///picked.jpg', width: 800, height: 800 });
});

describe('useCoverActions', () => {
	it('uploads the picked image on Premium and patches the cached playlist', async () => {
		jest.mocked(playlistApi.uploadCover).mockResolvedValueOnce({ coverUrl: COVER });
		const result = setup();

		await act(async () => result.current.change());

		expect(playlistApi.uploadCover).toHaveBeenCalledWith(ID, 'file:///cover-512.jpg');
		expect(patchPlaylist).toHaveBeenCalledWith(useQueryClient(), ID, { coverUrl: COVER });
		expect(showSuccess).toHaveBeenCalledWith('Cover mise à jour');
	});

	it('shows the Premium lock on the free plan, sends nothing and links to Settings', async () => {
		mockPlan.isPremium = false;
		const result = setup();

		await act(async () => result.current.change());

		expect(mockPickImage).not.toHaveBeenCalled();
		expect(playlistApi.uploadCover).not.toHaveBeenCalled();
		expect(Alert.alert).toHaveBeenCalledWith(
			'Réservé au Premium',
			expect.any(String),
			expect.any(Array)
		);
		alertButtons()
			.find(button => button.text === 'Paramètres')
			?.onPress?.();
		expect(parentNavigate).toHaveBeenCalledWith('ProfileTab', {
			screen: 'Settings',
			initial: false,
		});
	});

	it('refreshes the plan and shows the lock on PREMIUM_REQUIRED (downgraded elsewhere)', async () => {
		jest
			.mocked(playlistApi.uploadCover)
			.mockRejectedValueOnce(new ApiError('Premium', 'PREMIUM_REQUIRED', undefined, 403));
		const result = setup();

		await act(async () => result.current.change());

		expect(mockPlan.refetch).toHaveBeenCalled();
		expect(Alert.alert).toHaveBeenCalledWith(
			'Réservé au Premium',
			expect.any(String),
			expect.any(Array)
		);
		expect(patchPlaylist).not.toHaveBeenCalled();
	});

	it('removes the cover, back to the first track artwork', async () => {
		jest.mocked(playlistApi.removeCover).mockResolvedValueOnce({ coverUrl: null });
		const result = setup();

		await act(async () => result.current.remove());

		expect(patchPlaylist).toHaveBeenCalledWith(useQueryClient(), ID, { coverUrl: undefined });
		expect(showSuccess).toHaveBeenCalledWith('Cover retirée');
	});

	it('shows an error when the upload fails', async () => {
		jest.mocked(playlistApi.uploadCover).mockRejectedValueOnce(new Error('offline'));
		const result = setup();

		await act(async () => result.current.change());

		expect(showError).toHaveBeenCalledWith('Impossible de changer la cover');
	});

	it('does nothing when the picker is cancelled', async () => {
		mockPickImage.mockResolvedValueOnce(null);
		const result = setup();

		await act(async () => result.current.change());

		expect(playlistApi.uploadCover).not.toHaveBeenCalled();
	});
});
