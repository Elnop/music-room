import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PlaylistSharingContainer } from '@/features/playlists/features/editor/features/sharing/components/PlaylistSharingContainer';
import { ThemedSwitch } from '@/shared/theme/components/ThemedSwitch';
import { resetBackendUrl } from '@/shared/backend/lib/backendUrl';
import { showError, showSuccess, showWarning } from '@/shared/theme/lib/toast';
import { logger } from '@/shared/logging/logger';
import type {
	PlaylistStackParamList,
	PlaylistWithTracks,
} from '@/features/playlists/shared/playlist/playlistTypes';
import { renderWithClient } from '@test-utils/renderWithClient';
import { mockFetchRoutes } from '@test-utils/mockFetchRoutes';
import { fail, ok } from '@test-utils/fetchResponses';
import { signIn } from '@test-utils/signIn';
import { playlistWithTracks } from '@test-utils/playlistFixtures';
import { noop } from '@test-utils/noop';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/shared/backend/deviceService', () => ({ getAppVersion: () => '1.2.3' }));
jest.mock('socket.io-client', () => ({ io: jest.fn() }));
jest.mock('@/shared/theme/hooks/useTheme', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/configs/originalThemeConfig');
	return { useTheme: () => ({ theme: originalTheme }) };
});
jest.mock('@react-navigation/native', () => {
	const { useEffect } = jest.requireActual('react');
	return { useFocusEffect: (effect: () => void) => useEffect(effect, [effect]) };
});
jest.mock('@/shared/theme/lib/toast', () => ({
	showError: jest.fn(),
	showSuccess: jest.fn(),
	showWarning: jest.fn(),
}));
jest.mock(
	'@/features/playlists/features/editor/features/sharing/components/presenters/SwipeableUserItem',
	() => {
		const { Text } = jest.requireActual('react-native');
		return {
			SwipeableUserItem: (props: {
				user: { id: string; username: string };
				role: string;
				onRemove: (id: string) => void;
			}) => (
				<Text onPress={() => props.onRemove(props.user.id)}>
					{`${props.user.username} (${props.role})`}
				</Text>
			),
		};
	},
);

type Props = NativeStackScreenProps<PlaylistStackParamList, 'PlaylistSharing'>;

const PLAYLIST = 'GET /api/playlists/p1';
const SERVER_ERROR = 'Le serveur a rencontré un problème. Réessayez plus tard.';
const SEARCH = 'GET /api/profile/search?q=bo&limit=20';
let routes: ReturnType<typeof mockFetchRoutes>;
let clear: () => void = noop;

function answer(overrides: Partial<PlaylistWithTracks> = {}) {
	return ok({
		playlist: playlistWithTracks({
			collaboratorIds: ['c1'],
			visibility: 'private',
			editMode: 'restricted',
			...overrides,
		}),
	});
}

async function renderScreen() {
	const view = renderWithClient(
		<PlaylistSharingContainer
			route={{ key: 'k', name: 'PlaylistSharing', params: { playlistId: 'p1' } } as Props['route']}
			navigation={{} as Props['navigation']}
		/>,
	);
	clear = () => view.client.clear();
	await act(async () => {});
	return view;
}

async function searchBo() {
	fireEvent.changeText(screen.getByPlaceholderText('Rechercher un utilisateur…'), 'bo');
	await screen.findByText('bob', {}, { timeout: 2000 });
}

beforeEach(async () => {
	jest.clearAllMocks();
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	await resetBackendUrl();
	signIn('me');
	routes = mockFetchRoutes({
		[PLAYLIST]: answer(),
		'GET /api/playlists/p1/viewers': ok({ viewers: [{ id: 'v1', username: 'vic' }] }),
		'GET /api/profile/c1': ok({ id: 'c1', username: 'cora' }),
		[SEARCH]: ok([
			{ id: 'b1', username: 'bob', displayName: 'Bob' },
			{ id: 'v1', username: 'vic' },
			{ id: 'me', username: 'me' },
		]),
		'POST /api/playlists/p1/collaborators': ok({}),
		'POST /api/playlists/p1/viewers': ok({}),
		'DELETE /api/playlists/p1/collaborators/c1': ok({}),
		'DELETE /api/playlists/p1/viewers/c1': fail(404, 'NOT_FOUND'),
		'PATCH /api/playlists/p1': ok({ playlist: { id: 'p1', visibility: 'public' } }),
	});
});

afterEach(() => {
	clear();
	jest.restoreAllMocks();
});

describe('PlaylistSharingContainer', () => {
	it('lists the editors, then the viewers, of a private restricted playlist', async () => {
		await renderScreen();
		expect(await screen.findByText('Accès et modification')).toBeTruthy();
		expect(screen.getByText('Personnes ayant accès (2)')).toBeTruthy();
		expect(screen.getByText('cora (collaborator)')).toBeTruthy();
		expect(screen.getByText('vic (viewer)')).toBeTruthy();
	});

	it('toasts a playlist that fails to load', async () => {
		routes.routes[PLAYLIST] = fail(403, 'PLAYLIST_ACCESS_DENIED');
		await renderScreen();
		await waitFor(() =>
			expect(showError).toHaveBeenCalledWith('Vous ne pouvez pas modifier cette playlist'),
		);
	});

	it('leaves the list empty when the members fail to load', async () => {
		routes.routes['GET /api/playlists/p1/viewers'] = fail(500, 'INTERNAL');
		await renderScreen();
		expect(await screen.findByText("Personne n'a encore accès à cette playlist")).toBeTruthy();
	});

	it('shows the info card of an open public playlist', async () => {
		routes.routes[PLAYLIST] = answer({
			visibility: 'public',
			editMode: 'open',
			collaboratorIds: [],
		});
		routes.routes['GET /api/playlists/p1/viewers'] = ok({ viewers: [] });
		await renderScreen();
		expect(await screen.findByText('Playlist ouverte')).toBeTruthy();
		expect(screen.queryByPlaceholderText('Rechercher un utilisateur…')).toBeNull();
	});

	it('finds users, without the owner and the members, and adds one as a viewer', async () => {
		await renderScreen();
		await screen.findByText('vic (viewer)');
		await searchBo();
		expect(screen.queryByText('me')).toBeNull();
		expect(screen.queryByLabelText('Ajouter vic')).toBeNull();
		fireEvent.press(screen.getByLabelText('Ajouter bob'));
		expect(await screen.findByText('bob (viewer)')).toBeTruthy();
		expect(routes.calls()).toContain('POST /api/playlists/p1/viewers');
		expect(screen.queryByText('Résultats')).toBeNull();
	});

	it('takes back an add the server refuses', async () => {
		routes.routes['POST /api/playlists/p1/viewers'] = fail(500, 'INTERNAL');
		await renderScreen();
		await screen.findByText('vic (viewer)');
		await searchBo();
		fireEvent.press(screen.getByLabelText('Ajouter bob'));
		await waitFor(() => expect(showError).toHaveBeenCalledWith(SERVER_ERROR));
		expect(screen.queryByText('bob (viewer)')).toBeNull();
	});

	it('removes an editor, ignoring a missing viewer entry', async () => {
		await renderScreen();
		fireEvent.press(await screen.findByText('cora (collaborator)'));
		await waitFor(() => expect(showSuccess).toHaveBeenCalledWith('Utilisateur retiré'));
		expect(screen.queryByText('cora (collaborator)')).toBeNull();
	});

	it('puts back a member the server refuses to remove', async () => {
		routes.routes['DELETE /api/playlists/p1/collaborators/c1'] = fail(500, 'INTERNAL');
		await renderScreen();
		fireEvent.press(await screen.findByText('cora (collaborator)'));
		await waitFor(() => expect(showError).toHaveBeenCalledWith(SERVER_ERROR));
		expect(screen.getByText('cora (collaborator)')).toBeTruthy();
	});

	it('makes the playlist public with a warning, then reloads it', async () => {
		await renderScreen();
		await screen.findByText('vic (viewer)');
		routes.routes[PLAYLIST] = answer({ visibility: 'public' });
		const [visibility] = screen.UNSAFE_getAllByType(ThemedSwitch);
		await act(async () => fireEvent(visibility, 'valueChange', false));
		expect(showWarning).toHaveBeenCalledWith('Playlist publique : visible par tous');
		expect(await screen.findByText('Éditeurs')).toBeTruthy();
	});

	it('opens the edit mode with a warning, and toasts a refusal', async () => {
		routes.routes['PATCH /api/playlists/p1'] = fail(500, 'INTERNAL');
		await renderScreen();
		await screen.findByText('vic (viewer)');
		const editMode = screen.UNSAFE_getAllByType(ThemedSwitch)[1];
		await act(async () => fireEvent(editMode, 'valueChange', false));
		expect(showWarning).toHaveBeenCalledWith('Tous les membres pourront éditer');
		await waitFor(() => expect(showError).toHaveBeenCalledWith(SERVER_ERROR));
	});
});
