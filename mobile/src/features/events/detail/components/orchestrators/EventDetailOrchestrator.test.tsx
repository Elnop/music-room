import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventDetailOrchestrator } from './EventDetailOrchestrator';
import { resetBackendUrl } from '@/shared/services/backendUrl';
import { showInfo, showSuccess } from '@/shared/utils/toast';
import { logger } from '@/shared/utils/logger';
import type { EventStackParamList } from '@/features/events/types';
import { renderWithClient } from '@/test/renderWithClient';
import { mockFetchRoutes } from '@/test/fetchRoutes';
import { fail, ok } from '@/test/fetchResponses';
import { signIn } from '@/test/session';
import { musicEvent } from '@/test/eventFixtures';
import { startEventBeacon, stopEventBeacon } from '@/features/events/services/beaconAdvertiser';
import { useBeaconStore } from '@/features/events/stores/beaconStore';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/shared/services/deviceService', () => ({ getAppVersion: () => '1.2.3' }));
jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});
jest.mock('@/features/events/services/beaconAdvertiser', () => ({
	startEventBeacon: jest.fn(() => Promise.resolve()),
	stopEventBeacon: jest.fn(),
}));
let mockBroadcastAvailable = true;
jest.mock('@/shared/constants/platform', () => ({
	get BEACON_BROADCAST_AVAILABLE() {
		return mockBroadcastAvailable;
	},
}));
jest.mock('@/shared/utils/toast', () => ({
	showSuccess: jest.fn(),
	showError: jest.fn(),
	showInfo: jest.fn(),
}));

type Props = NativeStackScreenProps<EventStackParamList, 'EventDetail'>;

const navigation = { navigate: jest.fn(), goBack: jest.fn() };
let routes: ReturnType<typeof mockFetchRoutes>;
let clear: () => void = () => undefined;

async function renderDetail(waitForTitle = true) {
	const view = renderWithClient(
		<EventDetailOrchestrator
			route={{ key: 'k', name: 'EventDetail', params: { id: 'e1' } } as Props['route']}
			navigation={navigation as unknown as Props['navigation']}
		/>
	);
	clear = () => view.client.clear();
	if (waitForTitle) await screen.findByText('Rooftop');
	else await act(async () => {});
	return view;
}

beforeEach(async () => {
	jest.clearAllMocks();
	mockBroadcastAvailable = true;
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	await resetBackendUrl();
	signIn('me');
	routes = mockFetchRoutes({
		'GET /api/events/e1': ok({
			event: musicEvent({ playlist: { id: 'p1', name: 'Warm-up' } }),
		}),
		'DELETE /api/events/e1': ok({ id: 'e1' }),
	});
});

afterEach(() => {
	useBeaconStore.getState().stop();
	clear();
	jest.restoreAllMocks();
});

describe('EventDetailOrchestrator', () => {
	it('shows how to get in, the genres and opens the linked playlist', async () => {
		await renderDetail();
		expect(screen.getByText('Rooftop')).toBeTruthy();
		expect(screen.getByText('En cours')).toBeTruthy();
		expect(screen.getByLabelText('Comment y accéder : Bâtiment C, 7e étage')).toBeTruthy();
		expect(screen.getByText('Électro')).toBeTruthy();
		expect(screen.getByText('Organisé par bob')).toBeTruthy();

		fireEvent.press(screen.getByText('Ouvrir la playlist « Warm-up »'));
		expect(navigation.navigate).toHaveBeenCalledWith('PlaylistDetail', { id: 'p1' });
	});

	it('hides edit and delete from anyone but the organiser', async () => {
		await renderDetail();
		expect(screen.queryByText('Modifier')).toBeNull();
		expect(screen.queryByText('Supprimer')).toBeNull();
	});

	it('lets the organiser edit and delete the event', async () => {
		routes.routes['GET /api/events/e1'] = ok({
			event: musicEvent({ organizer: { id: 'me', username: 'me' } }),
		});
		jest
			.spyOn(Alert, 'alert')
			.mockImplementation((_title, _message, buttons) =>
				buttons?.find(button => button.style === 'destructive')?.onPress?.()
			);
		await renderDetail();

		fireEvent.press(screen.getByText('Modifier'));
		expect(navigation.navigate).toHaveBeenCalledWith('EventForm', { eventId: 'e1' });

		await act(async () => fireEvent.press(screen.getByText('Supprimer')));
		await waitFor(() => expect(navigation.goBack).toHaveBeenCalled());
		expect(showSuccess).toHaveBeenCalledWith('Événement supprimé');
		expect(routes.calls()).toContain('DELETE /api/events/e1');
	});

	it("lets the organiser broadcast the event's beacon and stop it", async () => {
		routes.routes['GET /api/events/e1'] = ok({
			event: musicEvent({ organizer: { id: 'me', username: 'me' } }),
		});
		await renderDetail();
		const toggle = () => screen.getByLabelText('Diffuser la balise');

		await act(async () => fireEvent(toggle(), 'valueChange', true));
		expect(startEventBeacon).toHaveBeenCalledWith(42);
		expect(screen.getByText(/Les téléphones proches voient votre événement/)).toBeTruthy();

		await act(async () => fireEvent(toggle(), 'valueChange', false));
		expect(stopEventBeacon).toHaveBeenCalled();
		expect(useBeaconStore.getState().status).toBe('idle');
	});

	it('offers the beacon only while the event is on', async () => {
		const later = (hours: number) => new Date(Date.now() + hours * 3_600_000).toISOString();
		routes.routes['GET /api/events/e1'] = ok({
			event: musicEvent({
				organizer: { id: 'me', username: 'me' },
				startsAt: later(1),
				endsAt: later(2),
			}),
		});
		await renderDetail();
		expect(screen.getByText("Disponible pendant l'événement")).toBeTruthy();
		expect(screen.getByLabelText('Diffuser la balise').props.disabled).toBe(true);
	});

	it('explains in a browser that the beacon is broadcast from the Android app', async () => {
		mockBroadcastAvailable = false;
		routes.routes['GET /api/events/e1'] = ok({
			event: musicEvent({ organizer: { id: 'me', username: 'me' } }),
		});
		await renderDetail();

		expect(screen.getByText(/Disponible depuis l'app Android/)).toBeTruthy();
		expect(screen.queryByLabelText('Diffuser la balise')).toBeNull();
		expect(screen.getByText('Modifier')).toBeTruthy();
	});

	it('leaves an event deleted elsewhere', async () => {
		routes.routes['GET /api/events/e1'] = fail(404, 'EVENT_NOT_FOUND');
		await renderDetail(false);
		await waitFor(() => expect(navigation.goBack).toHaveBeenCalled());
		expect(showInfo).toHaveBeenCalledWith('Cet événement a été supprimé');
	});
});
