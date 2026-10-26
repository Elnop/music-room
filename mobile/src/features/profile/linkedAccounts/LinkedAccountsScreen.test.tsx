import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { LinkedAccountsOrchestrator } from './components/orchestrators/LinkedAccountsOrchestrator';
import {
	registerLinkedAccountsBridge,
	type LinkedProvider,
} from '@/shared/services/linkedAccountsBridge';
import { showError, showSuccess } from '@/shared/utils/toast';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/shared/services/deviceService', () => ({ getAppVersion: () => '1.0.0' }));

jest.mock('@/shared/services/playbackBridge', () => ({
	usePlayerHeight: () => 0,
}));

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/shared/utils/toast', () => ({
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
let mockGoogleCredential: () => void = () => undefined;

beforeEach(() => {
	jest.clearAllMocks();
	mockProvidersData = [password, google];
	mockIsLoading = false;
	mockError = null;
	mockGoogleButton = undefined;

	registerLinkedAccountsBridge({
		useLinkedProviders: () =>
			({
				data: mockProvidersData,
				isLoading: mockIsLoading,
				error: mockError,
				errorUpdatedAt: mockError ? Date.now() : 0,
				isFetchedAfterMount: Boolean(mockError),
			}) as never,
		useLinkProvider: () => ({ mutateAsync: mockLinkProvider }) as never,
		useUnlinkProvider: () => ({ mutateAsync: mockUnlinkProvider }) as never,
		useGoogleButton: onCredential => {
			mockGoogleCredential = onCredential;
			return mockGoogleButton;
		},
	});
});

describe('LinkedAccountsScreen', () => {
	it('lists each sign-in method with its state', () => {
		render(<LinkedAccountsOrchestrator />);

		expect(screen.getByTestId('linked-account-password')).toHaveTextContent(/Lié · Principal/);
		expect(screen.getByLabelText('Délier Google')).toBeTruthy();
		expect(screen.getByLabelText('Lier Facebook')).toBeTruthy();
		expect(screen.queryByLabelText(/Lier Email|Délier Email/)).toBeNull();
	});

	it('shows error state when providers could not be loaded', () => {
		mockProvidersData = undefined;
		mockError = new Error('Server exploded');

		render(<LinkedAccountsOrchestrator />);

		expect(screen.getByText('Impossible de charger les comptes liés')).toBeTruthy();
		expect(showError).toHaveBeenCalled();
	});

	it('links Google when pressing Lier Google', async () => {
		mockProvidersData = [password];
		mockLinkProvider.mockResolvedValueOnce(undefined);

		render(<LinkedAccountsOrchestrator />);
		fireEvent.press(screen.getByLabelText('Lier Google'));

		await waitFor(() => {
			expect(mockLinkProvider).toHaveBeenCalledWith('google');
			expect(showSuccess).toHaveBeenCalledWith('Compte Google lié');
		});
	});

	it('unlinks Google when pressing Délier Google', async () => {
		mockUnlinkProvider.mockResolvedValueOnce(undefined);

		render(<LinkedAccountsOrchestrator />);
		fireEvent.press(screen.getByLabelText('Délier Google'));

		await waitFor(() => {
			expect(mockUnlinkProvider).toHaveBeenCalledWith('google');
			expect(showSuccess).toHaveBeenCalledWith('Compte Google délié');
		});
	});

	it('shows error toast when linking fails', async () => {
		mockProvidersData = [password];
		mockLinkProvider.mockRejectedValueOnce(new Error('Link failed'));

		render(<LinkedAccountsOrchestrator />);
		fireEvent.press(screen.getByLabelText('Lier Google'));

		await waitFor(() => {
			expect(showError).toHaveBeenCalledWith('Impossible de lier le compte Google');
		});
	});

	it('shows error toast when unlinking fails', async () => {
		mockUnlinkProvider.mockRejectedValueOnce(new Error('Unlink failed'));

		render(<LinkedAccountsOrchestrator />);
		fireEvent.press(screen.getByLabelText('Délier Google'));

		await waitFor(() => {
			expect(showError).toHaveBeenCalledWith('Impossible de délier le compte Google');
		});
	});

	it('does not show error toast when sign in was cancelled', async () => {
		mockProvidersData = [password];
		mockLinkProvider.mockRejectedValueOnce(new Error('SIGN_IN_CANCELLED'));

		render(<LinkedAccountsOrchestrator />);
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

		render(<LinkedAccountsOrchestrator />);

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

		render(<LinkedAccountsOrchestrator />);

		expect(screen.getByLabelText('Délier Google')).toBeTruthy();
		expect(screen.queryByTestId('google-button-slot')).toBeNull();
	});
});
