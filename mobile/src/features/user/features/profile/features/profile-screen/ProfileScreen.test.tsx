import React from 'react';
import type { ReactElement } from 'react';
import { Alert, useWindowDimensions } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ProfileContainer } from '@/features/user/features/profile/features/profile-screen/components/ProfileContainer';

const mockLogout = jest.fn();
const mockNavigate = jest.fn();
const mockSetOptions = jest.fn();

jest.mock('@/shared/theme/hooks/useTheme', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/configs/originalThemeConfig');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({ navigate: mockNavigate, setOptions: mockSetOptions }),
	useFocusEffect: jest.fn(),
}));

const mockUser = {
	id: 'me',
	username: 'bob',
	displayName: 'Bob',
	email: 'bob@example.com',
	createdAt: '2026-10-01',
};

jest.mock('@/shared/backend/hooks/useSession', () => ({
	useSession: (selector: (s: { user: typeof mockUser }) => unknown) => selector({ user: mockUser }),
}));
jest.mock('@/features/user/features/profile/shared/profile/lib/sessionActions', () => ({
	logout: () => mockLogout(),
}));

jest.mock('@/features/user/features/profile/shared/profile/hooks/useProfileQueries', () => ({
	useUserMusicPreferences: () => ({ data: { genres: [] }, refetch: jest.fn() }),
	useUserStats: () => ({ data: { followersCount: 0, followingCount: 0 }, refetch: jest.fn() }),
}));

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
	__esModule: true,
	default: jest.fn(() => ({ width: 390, height: 844, scale: 1, fontScale: 1 })),
}));

jest.mock('@/shared/backend/deviceService', () => ({
	getBuildLabel: () => 'Zumik 1.0.0 (build 42 · a1b2c3d)',
}));

type AlertButtons = Parameters<typeof Alert.alert>[2];

describe('ProfileScreen logout', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(Alert, 'alert').mockImplementation(() => {});
	});

	function pressLogout(): AlertButtons {
		render(<ProfileContainer />);
		fireEvent.press(screen.getByText('Se déconnecter'));
		expect(Alert.alert).toHaveBeenCalledWith('Se déconnecter ?', expect.any(String), [
			expect.objectContaining({ text: 'Annuler', style: 'cancel' }),
			expect.objectContaining({ text: 'Se déconnecter', style: 'destructive' }),
		]);
		return (Alert.alert as jest.Mock).mock.calls[0][2];
	}

	it('asks for confirmation instead of logging out on the first tap', () => {
		pressLogout();
		expect(mockLogout).not.toHaveBeenCalled();
	});

	it('logs out once confirmed', () => {
		const buttons = pressLogout();
		buttons?.find((b) => b.text === 'Se déconnecter')?.onPress?.();
		expect(mockLogout).toHaveBeenCalledTimes(1);
	});

	it('stays signed in when cancelled', () => {
		const buttons = pressLogout();
		buttons?.find((b) => b.text === 'Annuler')?.onPress?.();
		expect(mockLogout).not.toHaveBeenCalled();
	});
});

describe('ProfileScreen header', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	function renderHeader() {
		render(<ProfileContainer />);
		const { headerRight } = mockSetOptions.mock.calls.at(-1)[0] as {
			headerRight: () => ReactElement;
		};
		render(headerRight());
	}

	it('opens the profile editor from the pencil', () => {
		renderHeader();
		fireEvent.press(screen.getByRole('button', { name: 'Modifier le profil' }));
		expect(mockNavigate).toHaveBeenCalledWith('EditProfile');
	});

	it('opens the settings from the gear', () => {
		renderHeader();
		fireEvent.press(screen.getByRole('button', { name: 'Réglages' }));
		expect(mockNavigate).toHaveBeenCalledWith('Settings');
	});
});

describe('ProfileScreen build label', () => {
	it('shows the installed build at the bottom of the profile, as its only version', () => {
		render(<ProfileContainer />);
		expect(screen.getByText('Zumik 1.0.0 (build 42 · a1b2c3d)')).toBeTruthy();
		expect(screen.queryByText('Zumik v1.0.0')).toBeNull();
	});
});

describe('ProfileScreen on wide screens', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest
			.mocked(useWindowDimensions)
			.mockReturnValue({ width: 1440, height: 900, scale: 1, fontScale: 1 });
	});

	afterEach(() => {
		jest
			.mocked(useWindowDimensions)
			.mockReturnValue({ width: 390, height: 844, scale: 1, fontScale: 1 });
	});

	it('offers editing and settings as buttons of its own header', () => {
		render(<ProfileContainer />);
		fireEvent.press(screen.getByRole('button', { name: 'Modifier le profil' }));
		fireEvent.press(screen.getByRole('button', { name: 'Réglages' }));
		expect(mockNavigate.mock.calls).toStrictEqual([['EditProfile'], ['Settings']]);
	});

	it('shows a single version label, the build one', () => {
		render(<ProfileContainer />);
		expect(screen.getByText('Zumik 1.0.0 (build 42 · a1b2c3d)')).toBeTruthy();
		expect(screen.queryByText('Zumik v1.0.0')).toBeNull();
	});
});
