import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PrivacySettingsScreen } from './PrivacySettingsScreen';
import { privacyApi } from '@/services/privacyApi';
import { showError } from '@/shared/utils/toast';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/features/player/context/PlayerContext', () => ({
	usePlayerHeight: () => 0,
}));

jest.mock('@/features/auth/stores/authStore', () => ({
	useAuthStore: () => ({ accessToken: 'token' }),
}));

jest.mock('@/shared/utils/apiErrorMessage', () => ({
	apiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

jest.mock('@/shared/utils/toast', () => ({
	showError: jest.fn(),
}));

jest.mock('@/services/privacyApi', () => ({
	privacyApi: {
		getPrivacySettings: jest.fn(),
		updatePrivacySettings: jest.fn(),
	},
}));

type LeaveEvent = { data: { action: { type: string } } };

// goBack goes through the guard, as the navigator does.
const mockGoBack = jest.fn(() => pressBack());
const mockDispatch = jest.fn();
// The latest arguments the screen handed to usePreventRemove.
let mockPreventRemove = false;
let mockOnPreventRemove: (event: LeaveEvent) => void = () => undefined;

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({ goBack: mockGoBack, dispatch: mockDispatch }),
	usePreventRemove: (prevent: boolean, callback: (event: LeaveEvent) => void) => {
		mockPreventRemove = prevent;
		mockOnPreventRemove = callback;
	},
}));

const BACK = { type: 'GO_BACK' };

type AlertButtons = NonNullable<Parameters<typeof Alert.alert>[2]>;

/** Mimics a back press: the navigator calls the screen's guard only while it prevents leaving. */
function pressBack(): void {
	if (mockPreventRemove) mockOnPreventRemove({ data: { action: BACK } });
	else mockDispatch(BACK);
}

async function renderLoaded(): Promise<void> {
	render(<PrivacySettingsScreen />);
	await screen.findByText('Choisissez qui peut voir vos informations');
}

describe('PrivacySettingsScreen leave guard', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockPreventRemove = false;
		jest.spyOn(Alert, 'alert').mockImplementation(() => {});
		jest.mocked(privacyApi.getPrivacySettings).mockResolvedValue({
			userId: 'me',
			createdAt: '2026-10-01T00:00:00Z',
			updatedAt: '2026-10-01T00:00:00Z',
			emailVisibility: 'private',
			bioVisibility: 'public',
			avatarVisibility: 'public',
			musicPreferencesVisibility: 'public',
		});
		jest.mocked(privacyApi.updatePrivacySettings).mockResolvedValue(undefined as never);
	});

	it('leaves at once when nothing changed', async () => {
		await renderLoaded();

		pressBack();

		expect(Alert.alert).not.toHaveBeenCalled();
		expect(mockDispatch).toHaveBeenCalledWith(BACK);
	});

	it('asks before dropping unsaved changes', async () => {
		await renderLoaded();
		fireEvent.press(screen.getAllByText('Privé')[0]);

		pressBack();

		expect(Alert.alert).toHaveBeenCalledWith('Quitter sans enregistrer ?', expect.any(String), [
			expect.objectContaining({ text: 'Annuler', style: 'cancel' }),
			expect.objectContaining({ text: 'Quitter sans enregistrer', style: 'destructive' }),
		]);
		expect(mockDispatch).not.toHaveBeenCalled();

		const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as AlertButtons;
		buttons.find(b => b.text === 'Annuler')?.onPress?.();
		expect(mockDispatch).not.toHaveBeenCalled();

		buttons.find(b => b.text === 'Quitter sans enregistrer')?.onPress?.();
		expect(mockDispatch).toHaveBeenCalledWith(BACK);
	});

	it('leaves without asking once the changes are saved', async () => {
		await renderLoaded();
		fireEvent.press(screen.getAllByText('Privé')[0]);

		fireEvent.press(screen.getByText('Enregistrer'));

		await waitFor(() => expect(mockGoBack).toHaveBeenCalled());
		expect(privacyApi.updatePrivacySettings).toHaveBeenCalledWith(
			'token',
			expect.objectContaining({ avatarVisibility: 'private' })
		);
		expect(Alert.alert).not.toHaveBeenCalled();
		expect(mockDispatch).toHaveBeenCalledWith(BACK);
	});

	it('still asks when back is pressed during a save that then fails', async () => {
		let failSave: (error: Error) => void = () => undefined;
		jest.mocked(privacyApi.updatePrivacySettings).mockReturnValue(
			new Promise((_resolve, reject) => {
				failSave = reject;
			})
		);
		await renderLoaded();
		fireEvent.press(screen.getAllByText('Privé')[0]);
		fireEvent.press(screen.getByText('Enregistrer'));

		pressBack();
		expect(Alert.alert).toHaveBeenCalledTimes(1);

		await act(async () => {
			failSave(new Error('network'));
		});
		expect(showError).toHaveBeenCalled();

		pressBack();
		expect(Alert.alert).toHaveBeenCalledTimes(2);
		expect(mockGoBack).not.toHaveBeenCalled();
		expect(mockDispatch).not.toHaveBeenCalled();
	});
});
