import { act, renderHook } from '@testing-library/react-native';
import { useAvatarPicker } from './useAvatarPicker';
import { ApiError } from '@/shared/services/api';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/services/deviceService', () => ({ getAppVersion: () => '1.0.0' }));

const mockPicker = {
	requestMediaLibraryPermissionsAsync: jest.fn(),
	requestCameraPermissionsAsync: jest.fn(),
	launchImageLibraryAsync: jest.fn(),
	launchCameraAsync: jest.fn(),
};
jest.mock('expo-image-picker', () => ({
	requestMediaLibraryPermissionsAsync: () => mockPicker.requestMediaLibraryPermissionsAsync(),
	requestCameraPermissionsAsync: () => mockPicker.requestCameraPermissionsAsync(),
	launchImageLibraryAsync: (options: unknown) => mockPicker.launchImageLibraryAsync(options),
	launchCameraAsync: (options: unknown) => mockPicker.launchCameraAsync(options),
}));

const mockPrepareAvatar = jest.fn();
jest.mock('@/features/profile/utils/avatarImage', () => ({
	prepareAvatar: (asset: unknown) => mockPrepareAvatar(asset),
}));

const mockUploadAvatar = jest.fn();
const mockRemoveAvatar = jest.fn();
jest.mock('@/features/profile/services/profileApi', () => ({
	profileApi: {
		uploadAvatar: (uri: string, token: string) => mockUploadAvatar(token, uri),
		removeAvatar: (token: string) => mockRemoveAvatar(token),
	},
}));

const mockSetAvatarUrl = jest.fn();
jest.mock('@/shared/services/authSession', () => ({
	useSession: (selector: (s: { accessToken: string }) => unknown) =>
		selector({ accessToken: 'token' }),
	setAvatarUrl: (url: string | null) => mockSetAvatarUrl(url),
}));

const mockShowError = jest.fn();
const mockShowSuccess = jest.fn();
jest.mock('@/shared/utils/toast', () => ({
	showError: (message: string) => mockShowError(message),
	showSuccess: (message: string) => mockShowSuccess(message),
}));

const ASSET = { uri: 'file:///picked.jpg', width: 900, height: 900 };
const NEW_URL = 'https://cdn.example.com/avatars/me/new.jpg';

beforeEach(() => {
	jest.clearAllMocks();
	mockPicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
	mockPicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true });
	mockPicker.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [ASSET] });
	mockPicker.launchCameraAsync.mockResolvedValue({ canceled: false, assets: [ASSET] });
	mockPrepareAvatar.mockResolvedValue('file:///cache/avatar-512.jpg');
	mockUploadAvatar.mockResolvedValue({ avatarUrl: NEW_URL });
	mockRemoveAvatar.mockResolvedValue({ avatarUrl: null });
	mockSetAvatarUrl.mockResolvedValue(undefined);
});

async function run(action: (hook: ReturnType<typeof useAvatarPicker>) => Promise<void>) {
	const { result } = renderHook(() => useAvatarPicker());
	await act(async () => {
		await action(result.current);
	});
	return result;
}

describe('useAvatarPicker', () => {
	it('picks a square photo, resizes it, uploads it and updates the store', async () => {
		const result = await run(hook => hook.pickAndUpload('library'));

		expect(mockPicker.launchImageLibraryAsync).toHaveBeenCalledWith(
			expect.objectContaining({ allowsEditing: true, aspect: [1, 1], mediaTypes: ['images'] })
		);
		expect(mockPrepareAvatar).toHaveBeenCalledWith(ASSET);
		expect(mockUploadAvatar).toHaveBeenCalledWith('token', 'file:///cache/avatar-512.jpg');
		expect(mockSetAvatarUrl).toHaveBeenCalledWith(NEW_URL);
		expect(mockShowSuccess).toHaveBeenCalled();
		expect(result.current.isUploading).toBe(false);
	});

	it('uses the camera when asked', async () => {
		await run(hook => hook.pickAndUpload('camera'));

		expect(mockPicker.requestCameraPermissionsAsync).toHaveBeenCalled();
		expect(mockPicker.launchCameraAsync).toHaveBeenCalled();
		expect(mockPicker.launchImageLibraryAsync).not.toHaveBeenCalled();
		expect(mockUploadAvatar).toHaveBeenCalled();
	});

	it('sends nothing when the picker is cancelled', async () => {
		mockPicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null });

		await run(hook => hook.pickAndUpload('library'));

		expect(mockUploadAvatar).not.toHaveBeenCalled();
		expect(mockShowError).not.toHaveBeenCalled();
	});

	it('shows a French message and sends nothing when the permission is refused', async () => {
		mockPicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: false });

		await run(hook => hook.pickAndUpload('camera'));

		expect(mockPicker.launchCameraAsync).not.toHaveBeenCalled();
		expect(mockUploadAvatar).not.toHaveBeenCalled();
		expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('appareil photo'));
	});

	it.each([
		['INVALID_IMAGE', 400, "Ce fichier n'est pas une image JPEG, PNG ou WebP"],
		['FILE_TOO_LARGE', 413, 'La photo ne doit pas dépasser 2 Mo'],
		['RATE_LIMIT_EXCEEDED', 429, 'Trop de tentatives, réessayez dans un instant.'],
	])('shows a French toast on %s and keeps the old avatar', async (code, status, message) => {
		mockUploadAvatar.mockRejectedValue(new ApiError('x', code, undefined, status));

		const result = await run(hook => hook.pickAndUpload('library'));

		expect(mockShowError).toHaveBeenCalledWith(message);
		expect(mockSetAvatarUrl).not.toHaveBeenCalled();
		expect(result.current.isUploading).toBe(false);
	});

	it('removes the photo and clears it in the store', async () => {
		await run(hook => hook.remove());

		expect(mockRemoveAvatar).toHaveBeenCalledWith('token');
		expect(mockSetAvatarUrl).toHaveBeenCalledWith(null);
	});
});
