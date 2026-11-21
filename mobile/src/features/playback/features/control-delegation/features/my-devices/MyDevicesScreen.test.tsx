import React from 'react';
import { ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { createStore } from 'zustand';
import type { StoreApi } from 'zustand';
import { registerAuthSession } from '@/shared/backend/lib/authSession';
import type { SessionView } from '@/shared/backend/lib/authSession';
import { resetBackendUrl } from '@/shared/backend/lib/backendUrl';
import { musicControlApi } from '@/features/playback/features/control-delegation/shared/delegation/lib/musicControlApi';
import { showError, showSuccess } from '@/shared/theme/lib/toast';
import type {
	FriendUserSummary,
	UserDeviceWithLicenses,
} from '@/features/playback/features/control-delegation/shared/delegation/lib/types';
import { MyDevicesContainer } from '@/features/playback/features/control-delegation/features/my-devices/components/orchestrators/MyDevicesContainer';
import { logger } from '@/shared/logging/logger';
import { noop } from '@test-utils/noop';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockGetDeviceInfo = jest.fn();
jest.mock('@/shared/backend/deviceService', () => ({
	getAppVersion: () => '1.2.3',
	deviceService: { getDeviceInfo: () => mockGetDeviceInfo() },
}));

jest.mock('socket.io-client', () => ({ io: jest.fn() }));

jest.mock('@/shared/theme/lib/toast', () => ({
	showError: jest.fn(),
	showSuccess: jest.fn(),
}));

jest.mock('@/shared/theme/components/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/lib/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
	...jest.requireActual('@react-navigation/native'),
	useNavigation: () => ({ navigate: mockNavigate }),
}));

const fetchMock = jest.fn();

function jsonResponse(status: number, body: object): Response {
	return {
		ok: status >= 200 && status < 300,
		status,
		statusText: '',
		json: () => Promise.resolve(body),
		text: () => Promise.resolve(JSON.stringify(body)),
	} as unknown as Response;
}

function ok(data: object) {
	return jsonResponse(200, { success: true, data });
}
function fail(status: number, code: string, message: string) {
	return jsonResponse(status, { success: false, error: { code, message } });
}

const alice: FriendUserSummary = { id: 'user-a', username: 'alice' };
const bob: FriendUserSummary = { id: 'user-b', username: 'bob', displayName: 'Bob' };
const carol: FriendUserSummary = { id: 'user-c', username: 'carol' };

function device(
	deviceId: string,
	deviceName: string,
	licensed: FriendUserSummary[] = []
): UserDeviceWithLicenses {
	return {
		deviceId,
		deviceName,
		platform: 'android',
		model: 'Pixel 8',
		lastSeenAt: '2026-10-01T10:00:00Z',
		licenses: licensed.map(friend => ({
			user: {
				id: friend.id,
				username: friend.username,
				displayName: friend.displayName ?? null,
				avatarUrl: null,
			},
			grantedAt: '2026-10-01T10:00:00Z',
		})),
	};
}

const phone = device('device-1', 'Phone', [alice]);
const tablet = device('device-2', 'Tablet');

function requests(): {
	url: string;
	method: string;
	authorization?: string;
	body?: unknown;
}[] {
	return fetchMock.mock.calls.map(([url, init]) => ({
		url: url as string,
		method: (init as RequestInit).method ?? 'GET',
		authorization: ((init as RequestInit).headers as Record<string, string>)?.Authorization,
		body: (init as RequestInit).body ? JSON.parse((init as RequestInit).body as string) : undefined,
	}));
}

function toggle(label: string) {
	return screen.getByLabelText(label);
}

const FIRST_RENDER = { timeout: 15_000 };
jest.setTimeout(20_000);

let getPermissions: jest.SpyInstance;
let getFriends: jest.SpyInstance;
let sessionStore: StoreApi<SessionView>;

async function renderLoaded(
	devices: UserDeviceWithLicenses[],
	friends: FriendUserSummary[],
	allDevicesFriendIds: string[] = []
): Promise<void> {
	fetchMock.mockResolvedValueOnce(ok({ devices }));
	getFriends.mockResolvedValue(friends);
	getPermissions.mockResolvedValue(allDevicesFriendIds);
	render(<MyDevicesContainer />);
	await screen.findByText(
		'Choisissez quels amis peuvent contrôler la musique de chaque appareil',
		{},
		FIRST_RENDER
	);
	await waitFor(() => expect(screen.queryByTestId('skeleton-list')).toBeNull(), FIRST_RENDER);
}

async function pullToRefresh(): Promise<void> {
	const { refreshControl } = screen.UNSAFE_getByType(ScrollView).props;
	await act(async () => {
		await refreshControl.props.onRefresh();
	});
}

beforeEach(async () => {
	jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	globalThis.fetch = fetchMock as unknown as typeof fetch;
	fetchMock.mockReset();
	mockGetDeviceInfo.mockReset();
	mockGetDeviceInfo.mockResolvedValue({ deviceId: 'device-1' });
	getPermissions = jest.spyOn(musicControlApi, 'getMyPermissions');
	getFriends = jest.spyOn(musicControlApi, 'getFriends');
	(showError as jest.Mock).mockReset();
	(showSuccess as jest.Mock).mockReset();
	await AsyncStorage.clear();
	await resetBackendUrl();

	sessionStore = createStore<SessionView>(() => ({
		user: null,
		accessToken: 'access',
		isAuthenticated: true,
	}));
	registerAuthSession({
		store: sessionStore,
		isTokenExpiringSoon: () => false,
		refreshAccessToken: async () => true,
	});
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('MyDevicesScreen', () => {
	it('lists my devices with a switch per friend and marks the current device', async () => {
		await renderLoaded([phone, tablet], [alice, bob]);

		expect(requests()[0]).toMatchObject({ method: 'GET', authorization: 'Bearer access' });
		expect(requests()[0].url).toMatch(/\/api\/music-control\/devices$/u);
		expect(getFriends).toHaveBeenCalledWith('access');

		expect(screen.getByTestId('device-device-1')).toHaveTextContent(/Cet appareil/u);
		expect(screen.getByTestId('device-device-2')).not.toHaveTextContent(/Cet appareil/u);
		expect(screen.getByTestId('device-device-1')).toHaveTextContent(/Pixel 8/u);

		expect(toggle('alice sur Phone').props.value).toBe(true);
		expect(toggle('alice sur Tablet').props.value).toBe(false);
		expect(toggle('Bob sur Phone').props.value).toBe(false);
		expect(toggle('Bob sur Tablet').props.value).toBe(false);
		expect(toggle('Bob sur Tablet')).toBeEnabled();
	});

	it('shows an error toast and no list when loading fails', async () => {
		fetchMock.mockResolvedValueOnce(fail(500, 'INTERNAL_ERROR', 'Server exploded'));
		getFriends.mockResolvedValue([alice]);
		getPermissions.mockResolvedValue([]);

		render(<MyDevicesContainer />);

		await screen.findByText('Impossible de charger vos appareils', {}, FIRST_RENDER);
		expect(showError).toHaveBeenCalledWith(
			'Le serveur a rencontré un problème. Réessayez plus tard.'
		);
		expect(screen.queryByTestId('device-device-1')).toBeNull();
	});

	it('hides the model when it repeats the device name', async () => {
		await renderLoaded([device('device-3', 'Pixel 8'), tablet], [alice]);

		expect(screen.getByTestId('device-device-3')).not.toHaveTextContent(/Pixel 8 ·/u);
		expect(screen.getByTestId('device-device-3')).toHaveTextContent(/Vu le/u);
		expect(screen.getByTestId('device-device-2')).toHaveTextContent(/Pixel 8 ·/u);
	});

	it('shows an empty state when I have no device', async () => {
		await renderLoaded([], [alice]);

		expect(screen.getByText(/Aucun appareil/u)).toBeTruthy();
		expect(screen.queryByLabelText(/sur/u)).toBeNull();
	});

	it('shows an empty state when I have no friend', async () => {
		await renderLoaded([tablet], []);

		expect(screen.getByTestId('device-device-2')).toHaveTextContent(/Aucun ami/u);
		expect(screen.getByTestId('device-device-2')).toHaveTextContent(/vous suivent en retour/u);
		expect(screen.queryByLabelText(/sur Tablet/u)).toBeNull();

		fireEvent.press(screen.getByRole('button', { name: 'Trouver des amis' }));
		expect(mockNavigate).toHaveBeenCalledWith('FriendsTab');
	});

	it('grants a friend one device and keeps the switch on', async () => {
		await renderLoaded([phone, tablet], [alice, bob]);
		fetchMock.mockResolvedValueOnce(ok({ deviceId: 'device-2', license: phone.licenses[0] }));

		fireEvent(toggle('Bob sur Tablet'), 'valueChange', true);

		await waitFor(() => expect(showSuccess).toHaveBeenCalled());
		expect(requests()[1]).toMatchObject({ method: 'POST', authorization: 'Bearer access' });
		expect(requests()[1].url).toMatch(
			/\/api\/music-control\/devices\/device-2\/licenses\/user-b$/u
		);
		expect(toggle('Bob sur Tablet').props.value).toBe(true);
		expect(toggle('Bob sur Phone').props.value).toBe(false);
	});

	it('puts the switch back off and shows a French message when granting fails', async () => {
		await renderLoaded([phone, tablet], [alice, bob]);
		fetchMock.mockResolvedValueOnce(fail(400, 'NOT_FRIENDS', 'You can only license friends'));

		fireEvent(toggle('Bob sur Tablet'), 'valueChange', true);

		await waitFor(() =>
			expect(showError).toHaveBeenCalledWith(
				"Seuls vos amis peuvent recevoir l'accès à vos appareils"
			)
		);
		expect(toggle('Bob sur Tablet').props.value).toBe(false);
		expect(toggle('Bob sur Tablet')).toBeEnabled();
		expect(showSuccess).not.toHaveBeenCalled();
	});

	it('revokes a friend from one device and keeps the switch off', async () => {
		await renderLoaded([phone, tablet], [alice, bob]);
		fetchMock.mockResolvedValueOnce(ok({ message: 'License revoked' }));

		fireEvent(toggle('alice sur Phone'), 'valueChange', false);

		await waitFor(() => expect(showSuccess).toHaveBeenCalled());
		expect(requests()[1]).toMatchObject({ method: 'DELETE' });
		expect(requests()[1].url).toMatch(
			/\/api\/music-control\/devices\/device-1\/licenses\/user-a$/u
		);
		expect(toggle('alice sur Phone').props.value).toBe(false);
	});

	it('puts the switch back on and shows a French message when revoking fails', async () => {
		await renderLoaded([phone, tablet], [alice, bob]);
		fetchMock.mockResolvedValueOnce(fail(404, 'DEVICE_NOT_FOUND', 'Device not found'));

		fireEvent(toggle('alice sur Phone'), 'valueChange', false);

		await waitFor(() => expect(showError).toHaveBeenCalledWith("Cet appareil n'existe plus"));
		expect(toggle('alice sur Phone').props.value).toBe(true);
	});

	it('disables only the pending switch while a toggle runs', async () => {
		await renderLoaded([phone, tablet], [alice, bob]);
		let answer: (response: Response) => void = noop;
		fetchMock.mockReturnValueOnce(
			new Promise<Response>(resolve => {
				answer = resolve;
			})
		);

		fireEvent(toggle('Bob sur Tablet'), 'valueChange', true);

		await waitFor(() => expect(toggle('Bob sur Tablet')).toBeDisabled());
		expect(toggle('Bob sur Phone')).toBeEnabled();
		expect(toggle('alice sur Tablet')).toBeEnabled();

		answer(ok({ deviceId: 'device-2', license: phone.licenses[0] }));
		await waitFor(() => expect(toggle('Bob sur Tablet')).toBeEnabled());
		expect(toggle('Bob sur Tablet').props.value).toBe(true);
	});

	it('shows a friend with "all my devices" on and disabled on every device', async () => {
		await renderLoaded([phone, tablet], [alice, carol], ['user-c']);

		for (const label of ['carol sur Phone', 'carol sur Tablet']) {
			expect(toggle(label).props.value).toBe(true);
			expect(toggle(label)).toBeDisabled();
		}
		expect(screen.getAllByText('Contrôle tous mes appareils')).toHaveLength(2);
		expect(toggle('alice sur Tablet')).toBeEnabled();
	});

	it('does not reload when the access token is refreshed', async () => {
		await renderLoaded([phone, tablet], [alice]);

		act(() => {
			sessionStore.setState({ accessToken: 'refreshed' });
		});

		expect(screen.getByTestId('device-device-1')).toBeTruthy();
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(getFriends).toHaveBeenCalledTimes(1);
		expect(getPermissions).toHaveBeenCalledTimes(1);
	});

	it('still lists the devices when the current device id is unavailable', async () => {
		mockGetDeviceInfo.mockRejectedValue(new Error('storage down'));
		await renderLoaded([phone], [alice]);

		expect(screen.getByTestId('device-device-1')).not.toHaveTextContent(/Cet appareil/u);
		expect(toggle('alice sur Phone').props.value).toBe(true);
	});

	it('shows skeletons, not a spinner, while the first load runs', async () => {
		fetchMock.mockReturnValueOnce(new Promise(() => undefined));
		getFriends.mockResolvedValue([alice]);
		getPermissions.mockResolvedValue([]);

		render(<MyDevicesContainer />);

		expect(await screen.findByLabelText('Chargement', {}, FIRST_RENDER)).toBeTruthy();
		expect(screen.queryByTestId('device-device-1')).toBeNull();
	});

	it('reloads devices, friends and permissions in place when pulled down', async () => {
		await renderLoaded([phone], [alice]);
		fetchMock.mockResolvedValueOnce(ok({ devices: [phone, tablet] }));
		getFriends.mockResolvedValue([alice, bob]);

		await pullToRefresh();

		expect(getFriends).toHaveBeenCalledTimes(2);
		expect(getPermissions).toHaveBeenCalledTimes(2);
		expect(screen.getByTestId('device-device-2')).toBeTruthy();
		expect(toggle('Bob sur Tablet').props.value).toBe(false);
		expect(screen.queryByTestId('skeleton-list')).toBeNull();
		expect(screen.UNSAFE_getByType(ScrollView).props.refreshControl.props.refreshing).toBe(false);
	});

	it('keeps the list and shows a toast when a refresh fails', async () => {
		await renderLoaded([phone], [alice]);
		fetchMock.mockResolvedValueOnce(fail(500, 'INTERNAL_ERROR', 'Server exploded'));

		await pullToRefresh();

		expect(showError).toHaveBeenCalledTimes(1);
		expect(screen.getByTestId('device-device-1')).toBeTruthy();
		expect(screen.queryByText('Impossible de charger vos appareils')).toBeNull();
		expect(screen.UNSAFE_getByType(ScrollView).props.refreshControl.props.refreshing).toBe(false);
	});

	describe('rename (#352)', () => {
		const renamed = { ...tablet, deviceName: 'Salon' };

		async function openRename(name = 'Tablet'): Promise<void> {
			fireEvent.press(screen.getByLabelText(`Renommer l'appareil ${name}`));
			await screen.findByText("Renommer l'appareil");
		}

		it('opens the form with the current name', async () => {
			await renderLoaded([phone, tablet], [alice]);

			await openRename();

			expect(screen.getByDisplayValue('Tablet')).toBeTruthy();
		});

		it('saves the trimmed name, reloads the list and shows a toast', async () => {
			await renderLoaded([phone, tablet], [alice]);
			await openRename();
			fetchMock.mockResolvedValueOnce(ok({ device: renamed }));
			fetchMock.mockResolvedValueOnce(ok({ devices: [phone, renamed] }));

			fireEvent.changeText(screen.getByDisplayValue('Tablet'), '  Salon ');
			fireEvent.press(screen.getByText('Enregistrer'));

			await waitFor(() => expect(showSuccess).toHaveBeenCalledWith('Appareil renommé'));
			expect(requests()[1]).toMatchObject({
				method: 'PATCH',
				authorization: 'Bearer access',
				body: { name: 'Salon' },
			});
			expect(requests()[1].url).toMatch(/\/api\/music-control\/devices\/device-2$/u);
			await waitFor(() =>
				expect(screen.getByTestId('device-device-2')).toHaveTextContent(/Salon/u)
			);
			expect(screen.queryByText("Renommer l'appareil")).toBeNull();
		});

		it("goes back to the system name with « Nom d'origine »", async () => {
			await renderLoaded([phone, renamed], [alice]);
			await openRename('Salon');
			fetchMock.mockResolvedValueOnce(ok({ device: tablet }));
			fetchMock.mockResolvedValueOnce(ok({ devices: [phone, tablet] }));

			fireEvent.press(screen.getByText("Nom d'origine"));

			await waitFor(() => expect(showSuccess).toHaveBeenCalledWith('Appareil renommé'));
			expect(requests()[1]).toMatchObject({ method: 'PATCH', body: { name: null } });
			await waitFor(() =>
				expect(screen.getByTestId('device-device-2')).toHaveTextContent(/Tablet/u)
			);
		});

		it('refuses an empty name without calling the server', async () => {
			await renderLoaded([phone, tablet], [alice]);
			await openRename();

			fireEvent.changeText(screen.getByDisplayValue('Tablet'), '   ');
			fireEvent.press(screen.getByText('Enregistrer'));

			expect(await screen.findByText('Saisissez un nom')).toBeTruthy();
			expect(fetchMock).toHaveBeenCalledTimes(1);
		});

		it('keeps the form open and shows a French toast when the device is gone', async () => {
			await renderLoaded([phone, tablet], [alice]);
			await openRename();
			fetchMock.mockResolvedValueOnce(fail(404, 'DEVICE_NOT_FOUND', 'Device not found'));

			fireEvent.press(screen.getByText('Enregistrer'));

			await waitFor(() => expect(showError).toHaveBeenCalledWith("Cet appareil n'existe plus"));
			expect(screen.getByText("Renommer l'appareil")).toBeTruthy();
			expect(showSuccess).not.toHaveBeenCalled();
		});

		it('closes the form with « Annuler » without calling the server', async () => {
			await renderLoaded([phone, tablet], [alice]);
			await openRename();

			fireEvent.press(screen.getByText('Annuler'));

			await waitFor(() => expect(screen.queryByText("Renommer l'appareil")).toBeNull());
			expect(fetchMock).toHaveBeenCalledTimes(1);
		});
	});
});
