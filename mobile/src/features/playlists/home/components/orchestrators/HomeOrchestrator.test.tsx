import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeOrchestrator } from './HomeOrchestrator';
import { resetBackendUrl } from '@/shared/services/backendUrl';
import { showError } from '@/shared/utils/toast';
import { logger } from '@/shared/utils/logger';
import type { Playlist, PlaylistStackParamList } from '@/features/playlists/types';
import { renderWithClient } from '@/test/renderWithClient';
import { mockFetchRoutes } from '@/test/fetchRoutes';
import { fail, ok } from '@/test/fetchResponses';
import { signIn } from '@/test/session';
import '@/test/playback';
import { Text } from '@/shared/components/ui/Text';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/shared/services/deviceService', () => ({ getAppVersion: () => '1.2.3' }));
jest.mock('socket.io-client', () => ({ io: jest.fn() }));
jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});
let mockFocus: () => void = () => undefined;
jest.mock('@react-navigation/native', () => {
	const { useEffect } = jest.requireActual('react');
	return {
		useFocusEffect: (effect: () => void) => {
			mockFocus = effect;
			useEffect(effect, [effect]);
		},
	};
});
jest.mock('@/shared/utils/toast', () => ({ showError: jest.fn() }));

type Props = NativeStackScreenProps<PlaylistStackParamList, 'Home'>;

const ME = { id: 'me', username: 'me', displayName: 'Moi' };

const playlist = (id: string, overrides: Partial<Playlist> = {}): Playlist => ({
	id,
	name: id,
	ownerId: 'me',
	collaboratorIds: [],
	viewerIds: [],
	trackCount: 1,
	visibility: 'public',
	editMode: 'open',
	createdAt: '',
	updatedAt: '',
	...overrides,
});

const parentNavigate = jest.fn();
const navigation = {
	navigate: jest.fn(),
	setOptions: jest.fn(),
	getParent: () => ({ navigate: parentNavigate }),
};
let routes: ReturnType<typeof mockFetchRoutes>;
let clear: () => void = () => undefined;

function renderHome(nearbyEvents?: React.ReactNode) {
	const view = renderWithClient(
		<HomeOrchestrator
			route={{ key: 'k', name: 'Home' } as Props['route']}
			navigation={navigation as unknown as Props['navigation']}
			nearbyEvents={nearbyEvents}
		/>
	);
	clear = () => view.client.clear();
	return view;
}

async function renderScreen(nearbyEvents?: React.ReactNode) {
	const view = renderHome(nearbyEvents);
	await screen.findByText('Playlists publiques');
	await act(async () => {});
	return view;
}

beforeEach(async () => {
	jest.clearAllMocks();
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	await resetBackendUrl();
	signIn('me');
	routes = mockFetchRoutes({
		'GET /api/playlists/public': ok({
			playlists: [
				playlist('Open', { ownerId: 'bob', owner: { id: 'bob', username: 'bob' } }),
				playlist('Mine', { owner: ME }),
			],
		}),
		'GET /api/friends': ok([
			{ id: 'f1', username: 'fred' },
			{ id: 'f2', username: 'nobody' },
		]),
		'GET /api/playlists/user/f1': ok({ playlists: [playlist('Fred mix', { ownerId: 'f1' })] }),
		'GET /api/playlists/user/f2': fail(500, 'INTERNAL'),
	});
});

afterEach(() => {
	clear();
	jest.restoreAllMocks();
});

describe('HomeOrchestrator', () => {
	it('shows a skeleton until the friends and public playlists answer', () => {
		routes.routes['GET /api/playlists/public'] = () => new Promise(() => undefined);
		routes.routes['GET /api/friends'] = () => new Promise(() => undefined);
		renderHome();
		expect(screen.getAllByTestId('skeleton-list').length).toBeGreaterThan(0);
	});

	it("shows the nearby events section, the friends' playlists and the public ones", async () => {
		await renderScreen(<Text>nearby events</Text>);
		expect(screen.getByText('nearby events')).toBeTruthy();
		expect(screen.getByText('Playlists de vos amis')).toBeTruthy();
		expect(screen.getByText('Fred mix')).toBeTruthy();
		expect(screen.getByText('Open')).toBeTruthy();
		expect(screen.queryByText('Vos playlists')).toBeNull();
		expect(routes.calls()).not.toContain('GET /api/playlists');
	});

	it('shows every owner as an avatar badge, named only for a screen reader', async () => {
		await renderScreen();
		expect(screen.queryByText(/^par /)).toBeNull();
		expect(screen.getByLabelText('Fred mix, par fred')).toBeTruthy();
		expect(screen.getByLabelText('Mine, par Moi')).toBeTruthy();
		expect(screen.getByLabelText('Open, par bob')).toBeTruthy();
		// Initials without a photo: one badge per card.
		for (const initials of ['FR', 'MO', 'BO']) {
			expect(screen.getByText(initials, { includeHiddenElements: true })).toBeTruthy();
		}
	});

	it('opens a playlist', async () => {
		await renderScreen();
		fireEvent.press(screen.getByLabelText('Open, par bob'));
		expect(navigation.navigate).toHaveBeenCalledWith('PlaylistDetail', { id: 'Open' });
	});

	it("hides the friends' section without a friend, or when no friend has a playlist", async () => {
		routes.routes['GET /api/friends'] = ok([]);
		await renderScreen();
		expect(screen.queryByText('Playlists de vos amis')).toBeNull();
		clear();

		routes.routes['GET /api/friends'] = ok([{ id: 'f1', username: 'fred' }]);
		routes.routes['GET /api/playlists/user/f1'] = ok({ playlists: [] });
		await renderScreen();
		expect(screen.queryByText('Playlists de vos amis')).toBeNull();
	});

	it("shows no friends' section while their playlists load", async () => {
		routes.routes['GET /api/friends'] = () => new Promise(() => undefined);
		await renderScreen();
		expect(screen.queryByText('Playlists de vos amis')).toBeNull();
	});

	it('puts the nearby events last', async () => {
		await renderScreen(<Text>nearby events</Text>);
		const texts = screen.getAllByText(/./).map(node => node.props.children);
		const order = ['Playlists de vos amis', 'Playlists publiques', 'nearby events'].map(text =>
			texts.indexOf(text)
		);
		expect(order[0]).toBeGreaterThan(-1);
		expect(order).toEqual([...order].sort((a, b) => a - b));
	});

	it('folds the public playlists', async () => {
		await renderScreen();
		fireEvent.press(screen.getByLabelText('Playlists publiques'));
		expect(screen.queryByText('Open')).toBeNull();
	});

	it('says when nothing is public', async () => {
		routes.routes['GET /api/playlists/public'] = ok({ playlists: [] });
		await renderScreen();
		expect(screen.getByText('Aucune playlist publique disponible')).toBeTruthy();
	});

	it('reloads on focus, and toasts a failed pull to refresh', async () => {
		await renderScreen();
		const before = routes.calls().length;
		await act(async () => mockFocus());
		expect(routes.calls().length).toBeGreaterThan(before);

		routes.routes['GET /api/playlists/public'] = fail(500, 'INTERNAL');
		const refresh = screen.UNSAFE_getByProps({ refreshing: false }).props.onRefresh;
		await act(async () => refresh());
		expect(showError).toHaveBeenCalledTimes(1);
		expect(screen.getByText('Open')).toBeTruthy();
	});

	it('logs a failed load of the friends and public playlists', async () => {
		routes.routes['GET /api/friends'] = fail(500, 'INTERNAL');
		routes.routes['GET /api/playlists/public'] = fail(500, 'INTERNAL');
		renderHome();
		await screen.findByText('Aucune playlist publique disponible');
		expect(logger.error).toHaveBeenCalledTimes(2);
	});
});
