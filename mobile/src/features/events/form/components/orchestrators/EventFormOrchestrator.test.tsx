import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { EventFormOrchestrator } from './EventFormOrchestrator';
import { createQueryClient } from '@/shared/query/queryClient';
import { queryKeys } from '@/shared/query/keys';
import { resetBackendUrl } from '@/shared/services/backendUrl';
import { showError } from '@/shared/utils/toast';
import { logger } from '@/shared/utils/logger';
import type { EventStackParamList } from '@/features/events/types';
import { renderWithClient } from '@/test/renderWithClient';
import { mockFetchRoutes } from '@/test/fetchRoutes';
import { ok } from '@/test/fetchResponses';
import { signIn } from '@/test/session';
import { musicEvent } from '@/test/eventFixtures';
import { formatEventDate } from '@/features/events/utils/eventDates';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/shared/services/deviceService', () => ({ getAppVersion: () => '1.2.3' }));
jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});
jest.mock('@/shared/utils/toast', () => ({
	showSuccess: jest.fn(),
	showError: jest.fn(),
	showInfo: jest.fn(),
}));
jest.mock('expo-location', () => ({
	Accuracy: { Balanced: 3 },
	requestForegroundPermissionsAsync: jest.fn(),
	getCurrentPositionAsync: jest.fn(),
	reverseGeocodeAsync: jest.fn(),
	geocodeAsync: jest.fn(),
}));
jest.mock('@react-native-community/datetimepicker', () => ({
	DateTimePickerAndroid: { open: jest.fn() },
}));

type Props = NativeStackScreenProps<EventStackParamList, 'EventForm'>;

const location = jest.mocked(Location);
const navigation = { goBack: jest.fn(), replace: jest.fn() };
let routes: ReturnType<typeof mockFetchRoutes>;
let sent: Record<string, unknown> | undefined;
let clear: () => void = () => undefined;

function renderForm(eventId?: string) {
	const client = createQueryClient();
	client.setQueryData(
		queryKeys.events.detail('e1'),
		musicEvent({ organizer: { id: 'me', username: 'me' } })
	);
	const view = renderWithClient(
		<EventFormOrchestrator
			route={
				{ key: 'k', name: 'EventForm', params: eventId ? { eventId } : undefined } as Props['route']
			}
			navigation={navigation as unknown as Props['navigation']}
		/>,
		client
	);
	clear = () => client.clear();
	return view;
}

const type = (placeholder: string, text: string) =>
	fireEvent.changeText(screen.getByPlaceholderText(placeholder), text);

const submit = async (label = "Créer l'événement") => {
	await act(async () => fireEvent.press(screen.getByText(label)));
};

beforeEach(async () => {
	jest.clearAllMocks();
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
	await resetBackendUrl();
	signIn('me');
	sent = undefined;
	location.requestForegroundPermissionsAsync.mockResolvedValue({
		status: 'granted',
	} as Location.LocationPermissionResponse);
	routes = mockFetchRoutes({
		'GET /api/playlists': ok({
			playlists: [
				{ id: 'p1', name: 'Warm-up', ownerId: 'me', visibility: 'public' },
				{ id: 'p2', name: 'Secret', ownerId: 'me', visibility: 'private' },
				{ id: 'p3', name: 'Not mine', ownerId: 'bob', visibility: 'public' },
			],
		}),
		'POST /api/events': body => {
			sent = body as Record<string, unknown>;
			return ok({ event: musicEvent({ id: 'new' }) });
		},
		'PATCH /api/events/e1': body => {
			sent = body as Record<string, unknown>;
			return ok({ event: musicEvent({ name: 'Renamed' }) });
		},
	});
});

afterEach(() => {
	clear();
	jest.restoreAllMocks();
});

describe('EventFormOrchestrator', () => {
	it('creates an event at the current position, without geocoding', async () => {
		location.getCurrentPositionAsync.mockResolvedValue({
			coords: { latitude: 48.9, longitude: 2.3 },
		} as Location.LocationObject);
		location.reverseGeocodeAsync.mockResolvedValue([
			{ streetNumber: '96', street: 'bd Bessières', postalCode: '75017', city: 'Paris' },
		] as Location.LocationGeocodedAddress[]);
		renderForm();

		type('Soirée sur le toit', 'Rooftop');
		await act(async () => fireEvent.press(screen.getByText('Utiliser ma position actuelle')));
		expect(screen.getByDisplayValue('96 bd Bessières, 75017 Paris')).toBeTruthy();
		type('Bâtiment C, 7e étage, code 4512', 'Code 4512');
		fireEvent.press(screen.getByLabelText('Rock'));
		await submit();

		expect(location.geocodeAsync).not.toHaveBeenCalled();
		expect(sent).toMatchObject({
			name: 'Rooftop',
			address: '96 bd Bessières, 75017 Paris',
			latitude: 48.9,
			longitude: 2.3,
			accessInfo: 'Code 4512',
			genres: ['rock'],
			playlistId: null,
		});
		expect(navigation.replace).toHaveBeenCalledWith('EventDetail', { id: 'new' });
	});

	it('geocodes a typed address and links one of my public playlists', async () => {
		location.geocodeAsync.mockResolvedValue([{ latitude: 45.7, longitude: 4.8 }]);
		renderForm();
		await screen.findByLabelText('Playlist liée : Warm-up');
		expect(screen.queryByLabelText('Playlist liée : Secret')).toBeNull();
		expect(screen.queryByLabelText('Playlist liée : Not mine')).toBeNull();

		type('Soirée sur le toit', 'Bar');
		type('96 bd Bessières, Paris', '1 place Bellecour, Lyon');
		fireEvent.press(screen.getByLabelText('Jazz'));
		fireEvent.press(screen.getByLabelText('Playlist liée : Warm-up'));
		await submit();

		expect(location.geocodeAsync).toHaveBeenCalledWith('1 place Bellecour, Lyon');
		expect(sent).toMatchObject({ latitude: 45.7, longitude: 4.8, playlistId: 'p1' });
	});

	it('explains a refused location permission and sends nothing', async () => {
		location.requestForegroundPermissionsAsync.mockResolvedValue({
			status: 'denied',
		} as Location.LocationPermissionResponse);
		renderForm();
		type('Soirée sur le toit', 'Bar');
		type('96 bd Bessières, Paris', 'Somewhere');
		fireEvent.press(screen.getByLabelText('Jazz'));
		await submit();

		expect(showError).toHaveBeenCalledWith(expect.stringContaining('Autorisez la localisation'));
		expect(sent).toBeUndefined();
	});

	it('asks for at least one genre', async () => {
		renderForm();
		type('Soirée sur le toit', 'Bar');
		type('96 bd Bessières, Paris', 'Somewhere');
		await submit();

		expect(screen.getByText('Choisissez au moins un genre')).toBeTruthy();
		expect(sent).toBeUndefined();
	});

	it('moves the end with a start picked after it', async () => {
		const later = new Date(Date.now() + 10 * 24 * 3_600_000);
		jest
			.mocked(DateTimePickerAndroid.open)
			.mockImplementation(({ onChange }) =>
				onChange?.(
					{ type: 'set', nativeEvent: { timestamp: later.getTime(), utcOffset: 0 } },
					later
				)
			);
		renderForm();
		await act(async () => fireEvent.press(screen.getByLabelText(/^Début :/)));

		const threeHoursLater = new Date(later.getTime() + 3 * 3_600_000);
		expect(screen.getByLabelText(`Début : ${formatEventDate(later)}`)).toBeTruthy();
		expect(screen.getByLabelText(`Fin : ${formatEventDate(threeHoursLater)}`)).toBeTruthy();
		expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(2);
	});

	it('edits an event from its cached copy and goes back', async () => {
		renderForm('e1');
		expect(screen.getByDisplayValue('Rooftop')).toBeTruthy();
		type('Soirée sur le toit', 'Renamed');
		await submit('Enregistrer');

		await waitFor(() => expect(navigation.goBack).toHaveBeenCalled());
		expect(location.geocodeAsync).not.toHaveBeenCalled();
		expect(sent).toMatchObject({
			name: 'Renamed',
			latitude: 48.8966,
			genres: ['electronic', 'rnb'],
		});
		expect(routes.calls()).toContain('PATCH /api/events/e1');
	});
});
