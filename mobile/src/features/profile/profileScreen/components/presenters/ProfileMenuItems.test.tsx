import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ProfileMenuItems } from './ProfileMenuItems';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

describe('ProfileMenuItems', () => {
	it('offers the linked accounts, the browser included', () => {
		const onLinkedAccounts = jest.fn();
		render(
			<ProfileMenuItems
				isLoading={false}
				onPrivacySettings={jest.fn()}
				onLinkedAccounts={onLinkedAccounts}
				onMyDevices={jest.fn()}
				onConfirmLogout={jest.fn()}
			/>
		);

		fireEvent.press(screen.getByLabelText('Comptes liés'));

		expect(onLinkedAccounts).toHaveBeenCalledTimes(1);
	});
});
