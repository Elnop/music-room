import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { NearbyEventsOrchestrator } from './NearbyEventsOrchestrator';
import { resetBackendUrl } from '@/shared/services/backendUrl';
import { logger } from '@/shared/utils/logger';
import { renderWithClient } from '@/test/renderWithClient';
import { mockFetchRoutes } from '@/test/fetchRoutes';
import { ok } from '@/test/fetchResponses';
import { signIn } from '@/test/session';
import { musicEvent } from '@/test/eventFixtures';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/shared/services/deviceService', () => ({ getAppVersion: () => '1.2.3' }));
jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});
const mockNavigate = jest.fn();
let mockFocused = true;
jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({ navigate: mockNavigate }),
	useIsFocused: () => mockFocused,
}));
jest.mock('expo-location', () => ({
	Accuracy: { Balanced: 3 },
	getForegroundPermissionsAsync: jest.fn(),
	requestForegroundPermissionsAsync: jest.fn(),
	hasServicesEnabledAsync: jest.fn(),
	watchPositionAsync: jest.fn(),
}));

const location = jest.mocked(Location);
const remove = jest.fn();
let moveTo: (latitude: number, longitude: number) => void = () => undefined;
let routes: ReturnType<typeof mockFetchRoutes>;
let clear: () => void = () => undefined;

const RIVER = { latitude: 48.8966, longitude: 2.3185 };

async function renderSection() {
	const view = renderWithClient(<NearbyEventsOrchestrator />);
	clear = () => view.client.clear();
	await screen.findByText('My party');
	return view;
}

beforeEach(async () => {
	jest.clearAllMocks();
	mockFocused = true;
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	await resetBackendUrl();
	signIn('me');
	location.getForegroundPermissionsAsync.mockResolvedValue({
		status: 'granted',
		canAskAgain: true,
	} as Location.LocationPermissionResponse);
	location.hasServicesEnabledAsync.mockResolvedValue(true);
	location.watchPositionAsync.mockImplementation(async (_options, callback) => {
		moveTo = (latitude, longitude) =>
			callback({ coords: { latitude, longitude } } as Location.LocationObject);
		return { remove };
	});
	routes = mockFetchRoutes({
		'GET /api/events': ok({
			events: [
				musicEvent({ id: 'river', name: 'River party', ...RIVER }),
				musicEvent({
					id: 'mine',
					name: 'My party',
					latitude: 45,
					longitude: 4,
					organizer: { id: 'me', username: 'me' },
				}),
			],
		}),
	});
});

afterEach(() => {
	clear();
	jest.restoreAllMocks();
});

describe('NearbyEventsOrchestrator', () => {
	it('shows an ongoing event as the phone comes near, and drops it away from it', async () => {
		await renderSection();
		await waitFor(() => expect(location.watchPositionAsync).toHaveBeenCalled());
		expect(screen.getByText('Recherche de votre position…')).toBeTruthy();

		await act(async () => moveTo(RIVER.latitude + 0.001, RIVER.longitude));
		expect(screen.getByText('River party')).toBeTruthy();
		expect(screen.getByText('110 m')).toBeTruthy();

		await act(async () => moveTo(RIVER.latitude + 0.01, RIVER.longitude));
		expect(screen.queryByText('River party')).toBeNull();
		expect(screen.getByText('Aucun événement à proximité')).toBeTruthy();
	});

	it('never sends the position to the server', async () => {
		await renderSection();
		await waitFor(() => expect(location.watchPositionAsync).toHaveBeenCalled());
		await act(async () => moveTo(RIVER.latitude, RIVER.longitude));
		const sent = routes.fetchMock.mock.calls.map(([url, init]) => `${url} ${init?.body ?? ''}`);
		expect(sent.join(' ')).not.toMatch(/48\.89|2\.31/);
	});

	it('stops following the position when the home is left', async () => {
		const view = await renderSection();
		await waitFor(() => expect(location.watchPositionAsync).toHaveBeenCalled());
		mockFocused = false;
		view.rerender(<NearbyEventsOrchestrator />);
		expect(remove).toHaveBeenCalled();
	});

	it('explains a missing permission and asks for it, keeping the section usable', async () => {
		location.getForegroundPermissionsAsync.mockResolvedValue({
			status: 'undetermined',
			canAskAgain: true,
		} as Location.LocationPermissionResponse);
		location.requestForegroundPermissionsAsync.mockResolvedValue({
			status: 'denied',
		} as Location.LocationPermissionResponse);
		await renderSection();

		expect(await screen.findByText(/Autorisez la localisation/)).toBeTruthy();
		await act(async () => fireEvent.press(screen.getByText('Autoriser la localisation')));
		expect(location.requestForegroundPermissionsAsync).toHaveBeenCalled();
		expect(location.watchPositionAsync).not.toHaveBeenCalled();
		expect(screen.getByText('Créer un événement')).toBeTruthy();
	});

	it('says when the GPS is off', async () => {
		location.hasServicesEnabledAsync.mockResolvedValue(false);
		await renderSection();
		expect(await screen.findByText(/Activez la localisation \(GPS\)/)).toBeTruthy();
	});

	it('lists my events, opens one and the creation form', async () => {
		await renderSection();
		fireEvent.press(screen.getByText('My party'));
		expect(mockNavigate).toHaveBeenCalledWith('EventDetail', { id: 'mine' });
		fireEvent.press(screen.getByText('Créer un événement'));
		expect(mockNavigate).toHaveBeenCalledWith('EventForm');
	});
});
