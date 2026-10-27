import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { originalTheme } from '@/shared/theme/original.theme';
import { subscriptionApi } from '@/shared/services/subscriptionApi';
import { showError } from '@/shared/utils/toast';
import type { Subscription } from '@/shared/types/subscription';
import { SettingsOrchestrator } from './components/orchestrators/SettingsOrchestrator';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/shared/components/form/BackendUrlField', () => ({
	BackendUrlField: () => null,
}));

jest.mock('@/shared/services/deviceService', () => ({ getAppVersion: () => '1.0.0' }));

jest.mock('@/shared/services/authSession', () => ({
	useSession: (selector: (s: { isAuthenticated: boolean }) => unknown) =>
		selector({ isAuthenticated: true }),
}));

jest.mock('@/shared/services/subscriptionApi', () => ({
	subscriptionApi: { getSubscription: jest.fn(), changePlan: jest.fn() },
}));

jest.mock('@/shared/utils/toast', () => ({ showError: jest.fn() }));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
	...jest.requireActual('@react-navigation/native'),
	useNavigation: () => ({ navigate: mockNavigate }),
}));

const FREE: Subscription = { plan: 'free', premiumFeatures: ['playlist_cover'] };
const PREMIUM: Subscription = { ...FREE, plan: 'premium' };

let client: QueryClient;

function renderSettings() {
	render(
		<QueryClientProvider client={client}>
			<SettingsOrchestrator />
		</QueryClientProvider>
	);
}

beforeEach(() => {
	jest.clearAllMocks();
	client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	jest.mocked(subscriptionApi.getSubscription).mockResolvedValue(FREE);
});

afterEach(() => client.clear());

describe('SettingsOrchestrator', () => {
	it('renders the subscription and server sections without a theme picker', async () => {
		renderSettings();
		expect(screen.getByText('Abonnement')).toBeTruthy();
		expect(screen.getByText('Serveur')).toBeTruthy();
		expect(screen.queryByText('Thème')).toBeNull();
		expect(await screen.findByText('Offre actuelle : Gratuite')).toBeTruthy();
		expect(screen.getByText("Simulation : aucun paiement n'est demandé.")).toBeTruthy();
	});

	it('switches to Premium and back', async () => {
		jest.mocked(subscriptionApi.changePlan).mockResolvedValueOnce(PREMIUM);
		renderSettings();
		await screen.findByText('Offre actuelle : Gratuite');

		fireEvent(screen.getByLabelText('Premium'), 'valueChange', true);
		expect(await screen.findByText('Offre actuelle : Premium')).toBeTruthy();
		expect(subscriptionApi.changePlan).toHaveBeenCalledWith('premium');

		jest.mocked(subscriptionApi.changePlan).mockResolvedValueOnce(FREE);
		await waitFor(() => expect(screen.getByLabelText('Premium').props.disabled).toBeFalsy());
		fireEvent(screen.getByLabelText('Premium'), 'valueChange', false);
		expect(await screen.findByText('Offre actuelle : Gratuite')).toBeTruthy();
		expect(subscriptionApi.changePlan).toHaveBeenLastCalledWith('free');
	});

	it('puts the switch back and shows an error when the request fails', async () => {
		jest.mocked(subscriptionApi.changePlan).mockRejectedValueOnce(new Error('offline'));
		renderSettings();
		await screen.findByText('Offre actuelle : Gratuite');

		fireEvent(screen.getByLabelText('Premium'), 'valueChange', true);

		await waitFor(() => expect(showError).toHaveBeenCalledWith("Impossible de changer d'offre"));
		expect(screen.getByText('Offre actuelle : Gratuite')).toBeTruthy();
		expect(screen.getByLabelText('Premium').props.value).toBe(false);
	});

	it('leaves breathing room under its last section', () => {
		renderSettings();
		expect(
			StyleSheet.flatten(screen.UNSAFE_getByType(ScrollView).props.contentContainerStyle)
		).toEqual({ paddingBottom: originalTheme.spacing.xl });
	});

	it('opens the privacy policy', () => {
		renderSettings();
		fireEvent.press(screen.getByLabelText('Politique de confidentialité'));
		expect(mockNavigate).toHaveBeenCalledWith('PrivacyPolicy');
	});
});
