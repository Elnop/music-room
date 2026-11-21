import React from 'react';
import { Alert } from 'react-native';
import type { AlertButton } from 'react-native';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventDetailContainer } from '@/features/events/features/detail/components/EventDetailContainer';
import { resetBackendUrl } from '@/shared/backend/lib/backendUrl';
import { showInfo, showSuccess } from '@/shared/theme/lib/toast';
import { logger } from '@/shared/logging/logger';
import type { EventStackParamList } from '@/features/events/eventTypes';
import { renderWithClient } from '@test-utils/renderWithClient';
import { mockFetchRoutes } from '@test-utils/mockFetchRoutes';
import { fail, ok } from '@test-utils/fetchResponses';
import { signIn } from '@test-utils/signIn';
import { musicEvent } from '@test-utils/musicEvent';
import {
	startEventBeacon,
	stopEventBeacon,
} from '@/features/events/features/detail/lib/beaconAdvertiser';
import { beaconActions, beaconStore } from '@/features/events/features/detail/beaconStore';
import { noop } from '@test-utils/noop';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/shared/backend/deviceService', () => ({ getAppVersion: () => '1.2.3' }));
jest.mock('@/shared/theme/hooks/useTheme', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/configs/originalThemeConfig');
	return { useTheme: () => ({ theme: originalTheme }) };
});
jest.mock('@/features/events/features/detail/lib/beaconAdvertiser', () => ({
	startEventBeacon: jest.fn(() => Promise.resolve()),
	stopEventBeacon: jest.fn(),
}));
let mockBroadcastAvailable = true;
jest.mock('@/shared/platform/platformConfig', () => ({
	get BEACON_BROADCAST_AVAILABLE() {
		return mockBroadcastAvailable;
	},
}));
jest.mock('@/shared/theme/lib/toast', () => ({
	showSuccess: jest.fn(),
	showError: jest.fn(),
	showInfo: jest.fn(),
}));

function pressDestructive(_title: string, _message?: string, buttons?: AlertButton[]) {
	buttons?.find(button => button.style === 'destructive')?.onPress?.();
}

type Props = NativeStackScreenProps<EventStackParamList, 'EventDetail'>;

const navigation = { navigate: jest.fn(), goBack: jest.fn() };
let routes: ReturnType<typeof mockFetchRoutes>;
let clear: () => void = noop;

async function renderDetail(waitForTitle = true) {
	const view = renderWithClient(
		<EventDetailContainer
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
	beaconActions.stop();
	clear();
	jest.restoreAllMocks();
});

describe('EventDetailContainer', () => {
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
		jest.spyOn(Alert, 'alert').mockImplementation(pressDestructive);
		await renderDetail();

		fireEvent.press(screen.getByText('Modifier'));
		expect(navigation.navigate).toHaveBeenCalledWith('EventForm', { eventId: 'e1' });

		await act(async () => fireEvent.press(screen.getByText('Supprimer')));
		await waitFor(() => expect(navigation.goBack).toHaveBeenCalledWith());
		expect(showSuccess).toHaveBeenCalledWith('Événement supprimé');
		expect(routes.calls()).toContain('DELETE /api/events/e1');
	});

	it("lets the organiser broadcast the event's beacon and stop it", async () => {
		routes.routes['GET /api/events/e1'] = ok({
			event: musicEvent({ organizer: { id: 'me', username: 'me' } }),
		});
		await renderDetail();
		function toggle() {
			return screen.getByLabelText('Diffuser la balise');
		}

		await act(async () => fireEvent(toggle(), 'valueChange', true));
		expect(startEventBeacon).toHaveBeenCalledWith(42);
		expect(screen.getByText(/Les téléphones proches voient votre événement/u)).toBeTruthy();

		await act(async () => fireEvent(toggle(), 'valueChange', false));
		expect(stopEventBeacon).toHaveBeenCalledWith();
		expect(beaconStore.getState().status).toBe('idle');
	});

	it('offers the beacon only while the event is on', async () => {
		function later(hours: number) {
			return new Date(Date.now() + hours * 3_600_000).toISOString();
		}
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

		expect(screen.getByText(/Disponible depuis l'app Android/u)).toBeTruthy();
		expect(screen.queryByLabelText('Diffuser la balise')).toBeNull();
		expect(screen.getByText('Modifier')).toBeTruthy();
	});

	it('leaves an event deleted elsewhere', async () => {
		routes.routes['GET /api/events/e1'] = fail(404, 'EVENT_NOT_FOUND');
		await renderDetail(false);
		await waitFor(() => expect(navigation.goBack).toHaveBeenCalledWith());
		expect(showInfo).toHaveBeenCalledWith('Cet événement a été supprimé');
	});
});
