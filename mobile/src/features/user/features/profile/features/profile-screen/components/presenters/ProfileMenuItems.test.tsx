import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ProfileMenuItems } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileMenuItems';

jest.mock('@/shared/theme/hooks/useTheme', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/configs/originalThemeConfig');
	return { useTheme: () => ({ theme: originalTheme }) };
});

describe('ProfileMenuItems', () => {
	it('offers the linked accounts, the browser included', () => {
		const onLinkedAccounts = jest.fn();
		render(
			<ProfileMenuItems
				actions={{
					isLoggingOut: false,
					onEditProfile: jest.fn(),
					onSettings: jest.fn(),
					onMusicPreferences: jest.fn(),
					onPrivacySettings: jest.fn(),
					onLinkedAccounts,
					onMyDevices: jest.fn(),
					onConfirmLogout: jest.fn(),
				}}
			/>
		);

		fireEvent.press(screen.getByLabelText('Comptes liés'));

		expect(onLinkedAccounts).toHaveBeenCalledTimes(1);
	});
});
