import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { EditProfileContainer } from '@/features/user/features/profile/features/edit-profile/components/EditProfileContainer';

const mockPickAndUpload = jest.fn();
const mockRemove = jest.fn();
const mockPicker = { isUploading: false };
const mockSession: { user: Record<string, unknown> | null; accessToken: string } = {
	user: { id: 'me', username: 'bob', displayName: 'Bob', createdAt: '2026-10-01' },
	accessToken: 'token',
};

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/shared/backend/deviceService', () => ({ getAppVersion: () => '1.0.0' }));

jest.mock('@/shared/theme/hooks/useTheme', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/configs/originalThemeConfig');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({ goBack: jest.fn() }),
}));

jest.mock('@/shared/backend/hooks/useSession', () => ({
	useSession: (selector: (s: typeof mockSession) => unknown) => selector(mockSession),
}));
jest.mock('@/features/user/features/profile/shared/profile/lib/sessionActions', () => ({
	setUser: jest.fn(),
}));

jest.mock('@/features/user/features/profile/features/edit-profile/hooks/useAvatarPicker', () => ({
	useAvatarPicker: () => ({
		isUploading: mockPicker.isUploading,
		pickAndUpload: mockPickAndUpload,
		remove: mockRemove,
	}),
}));

jest.mock('@/features/user/features/profile/shared/profile/hooks/useProfileMutations', () => ({
	useUpdateProfileMutation: () => ({
		mutateAsync: jest.fn(),
		isPending: false,
	}),
}));

type AlertButtons = NonNullable<Parameters<typeof Alert.alert>[2]>;

function openMenu(): AlertButtons {
	render(<EditProfileContainer />);
	fireEvent.press(screen.getByText('Changer la photo'));
	expect(Alert.alert).toHaveBeenCalledWith(
		'Photo de profil',
		expect.any(String),
		expect.any(Array),
	);
	return (Alert.alert as jest.Mock).mock.calls[0][2] as AlertButtons;
}

describe('EditProfileScreen profile photo (#351)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(Alert, 'alert').mockImplementation(() => {});
		mockPicker.isUploading = false;
		mockSession.user = { id: 'me', username: 'bob', displayName: 'Bob', createdAt: '2026-10-01' };
	});

	it('offers gallery, camera and cancel when there is no photo', () => {
		const buttons = openMenu();
		expect(buttons.map((b) => b.text)).toStrictEqual(['Galerie', 'Appareil photo', 'Annuler']);
	});

	it('also offers to remove the current photo', () => {
		mockSession.user = { ...mockSession.user, avatarUrl: 'https://cdn.test/me.jpg' };

		const buttons = openMenu();
		expect(buttons.map((b) => b.text)).toStrictEqual([
			'Galerie',
			'Appareil photo',
			'Retirer la photo',
			'Annuler',
		]);

		buttons.find((b) => b.text === 'Retirer la photo')?.onPress?.();
		expect(mockRemove).toHaveBeenCalledTimes(1);
	});

	it('starts the picker from the chosen source', () => {
		const buttons = openMenu();

		buttons.find((b) => b.text === 'Galerie')?.onPress?.();
		expect(mockPickAndUpload).toHaveBeenCalledWith('library');

		buttons.find((b) => b.text === 'Appareil photo')?.onPress?.();
		expect(mockPickAndUpload).toHaveBeenCalledWith('camera');
	});

	it('shows a spinner over the avatar while uploading', () => {
		mockPicker.isUploading = true;
		render(<EditProfileContainer />);
		expect(screen.getByTestId('avatar-uploading')).toBeTruthy();
	});
});
