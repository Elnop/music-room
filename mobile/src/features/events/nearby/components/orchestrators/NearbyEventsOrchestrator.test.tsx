import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
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
jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({ navigate: mockNavigate }),
}));

let clear: () => void = () => undefined;

beforeEach(async () => {
	jest.clearAllMocks();
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	await resetBackendUrl();
	signIn('me');
	mockFetchRoutes({
		'GET /api/events': ok({
			events: [
				musicEvent({ id: 'mine', name: 'My party', organizer: { id: 'me', username: 'me' } }),
				musicEvent({ id: 'other', name: 'Not mine' }),
			],
		}),
	});
	const view = renderWithClient(<NearbyEventsOrchestrator />);
	clear = () => view.client.clear();
	await screen.findByText('My party');
});

afterEach(() => {
	clear();
	jest.restoreAllMocks();
});

describe('NearbyEventsOrchestrator', () => {
	it('lists my events and opens one', () => {
		expect(screen.getByText('Aucun événement à proximité')).toBeTruthy();
		expect(screen.queryByText('Not mine')).toBeNull();
		fireEvent.press(screen.getByText('My party'));
		expect(mockNavigate).toHaveBeenCalledWith('EventDetail', { id: 'mine' });
	});

	it('opens the creation form', () => {
		fireEvent.press(screen.getByText('Créer un événement'));
		expect(mockNavigate).toHaveBeenCalledWith('EventForm');
	});
});
