import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { testTheme } from '@test-utils/theme';
import { subscriptionApi } from '@/features/subscription/lib/subscriptionApi';
import type { Subscription } from '@/features/subscription/lib/subscription';
import { SettingsContainer } from '@/features/user/features/settings/components/SettingsContainer';
import { PlanContainer } from '@/features/subscription/PlanContainer';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/shared/theme/components/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/lib/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/features/shell/components/orchestrators/BackendUrlFieldContainer', () => ({
	BackendUrlFieldContainer: () => null,
}));

jest.mock('@/shared/backend/deviceService', () => ({ getAppVersion: () => '1.0.0' }));

jest.mock('@/shared/backend/lib/authSession', () => ({
	useSession: (selector: (s: { isAuthenticated: boolean }) => unknown) =>
		selector({ isAuthenticated: true }),
}));

jest.mock('@/features/subscription/lib/subscriptionApi', () => ({
	subscriptionApi: { getSubscription: jest.fn(), changePlan: jest.fn() },
}));

jest.mock('@/shared/theme/lib/toast', () => ({ showError: jest.fn() }));

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
			<PlanContainer>
				{plan => <SettingsContainer subscription={plan} backendUrlField={null} />}
			</PlanContainer>
		</QueryClientProvider>
	);
}

beforeEach(() => {
	jest.clearAllMocks();
	client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	jest.mocked(subscriptionApi.getSubscription).mockResolvedValue(FREE);
});

afterEach(() => client.clear());

describe('SettingsContainer', () => {
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

		await waitFor(() =>
			expect(
				jest.requireMock<{ showError: jest.Mock }>('@/shared/theme/lib/toast').showError
			).toHaveBeenCalledWith("Impossible de changer d'offre")
		);
		expect(screen.getByText('Offre actuelle : Gratuite')).toBeTruthy();
		expect(screen.getByLabelText('Premium').props.value).toBe(false);
	});

	it('leaves breathing room under its last section', () => {
		renderSettings();
		expect(
			StyleSheet.flatten(screen.UNSAFE_getByType(ScrollView).props.contentContainerStyle)
		).toStrictEqual({ paddingBottom: testTheme.spacing.xl });
	});

	it('opens the privacy policy', () => {
		renderSettings();
		fireEvent.press(screen.getByLabelText('Politique de confidentialité'));
		expect(mockNavigate).toHaveBeenCalledWith('PrivacyPolicy');
	});
});
