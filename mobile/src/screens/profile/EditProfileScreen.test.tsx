import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { EditProfileScreen } from './EditProfileScreen';

const mockPickAndUpload = jest.fn();
const mockRemove = jest.fn();
const mockPicker = { isUploading: false };
const mockAuth: { user: Record<string, unknown>; accessToken: string } = {
	user: { id: 'me', username: 'bob', displayName: 'Bob', createdAt: '2026-10-01' },
	accessToken: 'token',
};

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/services/deviceService', () => ({ getAppVersion: () => '1.0.0' }));

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/features/player/context/PlayerContext', () => ({ usePlayerHeight: () => 0 }));

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({ goBack: jest.fn() }),
}));

jest.mock('@/features/auth/stores/authStore', () => {
	const useAuthStore = () => mockAuth;
	useAuthStore.setState = jest.fn();
	return { useAuthStore };
});

jest.mock('@/services/profileApi', () => ({ profileApi: {} }));

jest.mock('@/hooks/useAvatarPicker', () => ({
	useAvatarPicker: () => ({
		isUploading: mockPicker.isUploading,
		pickAndUpload: mockPickAndUpload,
		remove: mockRemove,
	}),
}));

type AlertButtons = NonNullable<Parameters<typeof Alert.alert>[2]>;

function openMenu(): AlertButtons {
	render(<EditProfileScreen />);
	fireEvent.press(screen.getByText('Changer la photo'));
	expect(Alert.alert).toHaveBeenCalledWith(
		'Photo de profil',
		expect.any(String),
		expect.any(Array)
	);
	return (Alert.alert as jest.Mock).mock.calls[0][2] as AlertButtons;
}

describe('EditProfileScreen profile photo (#351)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(Alert, 'alert').mockImplementation(() => {});
		mockPicker.isUploading = false;
		mockAuth.user = { id: 'me', username: 'bob', displayName: 'Bob', createdAt: '2026-10-01' };
	});

	it('offers gallery, camera and cancel when there is no photo', () => {
		const buttons = openMenu();
		expect(buttons.map(b => b.text)).toEqual(['Galerie', 'Appareil photo', 'Annuler']);
	});

	it('also offers to remove the current photo', () => {
		mockAuth.user = { ...mockAuth.user, avatarUrl: 'https://cdn.test/me.jpg' };

		const buttons = openMenu();
		expect(buttons.map(b => b.text)).toEqual([
			'Galerie',
			'Appareil photo',
			'Retirer la photo',
			'Annuler',
		]);

		buttons.find(b => b.text === 'Retirer la photo')?.onPress?.();
		expect(mockRemove).toHaveBeenCalledTimes(1);
	});

	it('starts the picker from the chosen source', () => {
		const buttons = openMenu();

		buttons.find(b => b.text === 'Galerie')?.onPress?.();
		expect(mockPickAndUpload).toHaveBeenCalledWith('library');

		buttons.find(b => b.text === 'Appareil photo')?.onPress?.();
		expect(mockPickAndUpload).toHaveBeenCalledWith('camera');
	});

	it('shows a spinner over the avatar while uploading', () => {
		mockPicker.isUploading = true;
		render(<EditProfileScreen />);
		expect(screen.getByTestId('avatar-uploading')).toBeTruthy();
	});
});
