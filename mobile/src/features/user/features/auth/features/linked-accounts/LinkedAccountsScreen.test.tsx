import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { LinkedAccountsContainer } from '@/features/user/features/auth/features/linked-accounts/components/LinkedAccountsContainer';
import type { LinkedProvider } from '@/features/user/features/auth/types';
import { showError, showSuccess } from '@/shared/theme/lib/toast';
import { noop } from '@test-utils/noop';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/shared/backend/deviceService', () => ({ getAppVersion: () => '1.0.0' }));

jest.mock('@/shared/theme/components/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/lib/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/shared/theme/lib/toast', () => ({
	showError: jest.fn(),
	showSuccess: jest.fn(),
}));

const password: LinkedProvider = {
	type: 'password',
	connectedAt: '2025-01-01T00:00:00Z',
	isPrimary: true,
};
const google: LinkedProvider = {
	type: 'google',
	connectedAt: '2025-02-01T00:00:00Z',
	isPrimary: false,
};

let mockProvidersData: LinkedProvider[] | undefined = [password, google];
let mockIsLoading = false;
let mockError: Error | null = null;
const mockLinkProvider = jest.fn();
const mockUnlinkProvider = jest.fn();
let mockGoogleButton: jest.Mock | undefined;
let mockGoogleCredential: () => void = noop;

jest.mock(
	'@/features/user/features/auth/features/linked-accounts/hooks/useLinkedProviders',
	() => ({
		useLinkedProviders: () => ({
			data: mockProvidersData,
			isLoading: mockIsLoading,
			error: mockError,
			errorUpdatedAt: mockError ? Date.now() : 0,
			isFetchedAfterMount: Boolean(mockError),
		}),
		useLinkProvider: () => ({ mutateAsync: mockLinkProvider }),
		useUnlinkProvider: () => ({ mutateAsync: mockUnlinkProvider }),
	})
);

jest.mock('@/features/user/features/auth/shared/sign-in/hooks/useProviderButtons', () => ({
	useProviderButtons: (onCredential: () => void) => {
		mockGoogleCredential = onCredential;
		return mockGoogleButton;
	},
}));

beforeEach(() => {
	jest.clearAllMocks();
	mockProvidersData = [password, google];
	mockIsLoading = false;
	mockError = null;
	mockGoogleButton = undefined;
});

describe('LinkedAccountsScreen', () => {
	it('lists each sign-in method with its state', () => {
		render(<LinkedAccountsContainer />);

		expect(screen.getByTestId('linked-account-password')).toHaveTextContent(/Lié · Principal/u);
		expect(screen.getByLabelText('Délier Google')).toBeTruthy();
		expect(screen.getByLabelText('Lier Facebook')).toBeTruthy();
		expect(screen.queryByLabelText(/Lier Email|Délier Email/u)).toBeNull();
	});

	it('shows error state when providers could not be loaded', () => {
		mockProvidersData = undefined;
		mockError = new Error('Server exploded');

		render(<LinkedAccountsContainer />);

		expect(screen.getByText('Impossible de charger les comptes liés')).toBeTruthy();
		expect(showError).toHaveBeenCalled();
	});

	it('links Google when pressing Lier Google', async () => {
		mockProvidersData = [password];
		mockLinkProvider.mockResolvedValueOnce(undefined);

		render(<LinkedAccountsContainer />);
		fireEvent.press(screen.getByLabelText('Lier Google'));

		await waitFor(() => {
			expect(mockLinkProvider).toHaveBeenCalledWith('google');
			expect(showSuccess).toHaveBeenCalledWith('Compte Google lié');
		});
	});

	it('unlinks Google when pressing Délier Google', async () => {
		mockUnlinkProvider.mockResolvedValueOnce(undefined);

		render(<LinkedAccountsContainer />);
		fireEvent.press(screen.getByLabelText('Délier Google'));

		await waitFor(() => {
			expect(mockUnlinkProvider).toHaveBeenCalledWith('google');
			expect(showSuccess).toHaveBeenCalledWith('Compte Google délié');
		});
	});

	it('shows error toast when linking fails', async () => {
		mockProvidersData = [password];
		mockLinkProvider.mockRejectedValueOnce(new Error('Link failed'));

		render(<LinkedAccountsContainer />);
		fireEvent.press(screen.getByLabelText('Lier Google'));

		await waitFor(() => {
			expect(showError).toHaveBeenCalledWith('Impossible de lier le compte Google');
		});
	});

	it('shows error toast when unlinking fails', async () => {
		mockUnlinkProvider.mockRejectedValueOnce(new Error('Unlink failed'));

		render(<LinkedAccountsContainer />);
		fireEvent.press(screen.getByLabelText('Délier Google'));

		await waitFor(() => {
			expect(showError).toHaveBeenCalledWith('Impossible de délier le compte Google');
		});
	});

	it('does not show error toast when sign in was cancelled', async () => {
		mockProvidersData = [password];
		mockLinkProvider.mockRejectedValueOnce(new Error('SIGN_IN_CANCELLED'));

		render(<LinkedAccountsContainer />);
		fireEvent.press(screen.getByLabelText('Lier Google'));

		await waitFor(() => {
			expect(mockLinkProvider).toHaveBeenCalledWith('google');
		});
		expect(showError).not.toHaveBeenCalled();
	});

	it("links Google from Google's own button on the web", async () => {
		mockProvidersData = [password];
		mockGoogleButton = jest.fn();
		mockLinkProvider.mockResolvedValueOnce(undefined);

		render(<LinkedAccountsContainer />);

		expect(screen.getByTestId('google-button-slot')).toBeTruthy();
		expect(screen.queryByLabelText('Lier Google')).toBeNull();
		expect(screen.getByLabelText('Lier Facebook')).toBeTruthy();
		mockGoogleCredential();
		await waitFor(() => {
			expect(mockLinkProvider).toHaveBeenCalledWith('google');
			expect(showSuccess).toHaveBeenCalledWith('Compte Google lié');
		});
	});

	it('unlinks Google with the usual button on the web', () => {
		mockGoogleButton = jest.fn();

		render(<LinkedAccountsContainer />);

		expect(screen.getByLabelText('Délier Google')).toBeTruthy();
		expect(screen.queryByTestId('google-button-slot')).toBeNull();
	});
});
