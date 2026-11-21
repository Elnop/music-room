import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { createStore } from 'zustand';
import { DevicePickerSheetContainer } from '@/features/playback/features/control-delegation/features/device-picker/components/DevicePickerSheetContainer';
import { useConnectStore } from '@/features/playback/shared/player/stores/connectStore';
import { useQueueStore } from '@/features/playback/shared/player/stores/queueStore';
import { queueApi } from '@/features/playback/shared/player/lib/queueApi';
import { registerAuthSession } from '@/shared/backend/lib/authSession';
import type { SessionView } from '@/shared/backend/types/sessionTypes';
import { usePlayerStore } from '@/features/playback/shared/player/stores/playerStore';
import { musicControlApi } from '@/features/playback/features/control-delegation/shared/delegation/lib/musicControlApi';
import { ApiError } from '@/shared/backend/lib/api';
import { showError } from '@/shared/theme/lib/toast';
import type { DevicePickerResponse } from '@/features/playback/features/control-delegation/shared/delegation/lib/device.types';
import type { UserProfile } from '@/shared/users/userTypes';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import { logger } from '@/shared/logging/logger';

jest.mock('@/shared/theme/hooks/useTheme', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/configs/originalThemeConfig');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/shared/backend/deviceService', () => ({
	getAppVersion: () => '1.2.3',
	deviceService: { getDeviceInfo: jest.fn(async () => ({ deviceId: 'phone' })) },
}));

jest.mock(
	'@/features/playback/features/control-delegation/shared/delegation/lib/musicControlApi',
	() => ({
		musicControlApi: { getDevicePicker: jest.fn() },
	})
);

jest.mock('@/features/playback/shared/player/lib/queueApi', () => ({
	queueApi: { getQueue: jest.fn(), transfer: jest.fn() },
}));

jest.mock('@/shared/theme/lib/toast', () => ({
	showSuccess: jest.fn(),
	showError: jest.fn(),
	showInfo: jest.fn(),
}));

const mockGetDevicePicker = jest.mocked(musicControlApi.getDevicePicker);
const transfer = queueApi.transfer as jest.Mock;

function device(deviceId: string, deviceName: string, online = true) {
	return {
		deviceId,
		deviceName,
		platform: 'android',
		model: 'Model',
		lastSeenAt: '2026-10-15T00:00:00Z',
		access: 'all-devices' as const,
		online,
	};
}

const picker: DevicePickerResponse = {
	owners: [
		{
			ownerId: 'me',
			username: 'moi',
			isSelf: true,
			devices: [
				device('phone', 'Mon téléphone'),
				device('tablet', 'Ma tablette', false),
				device('pc', 'Mon PC'),
			],
		},
		{
			ownerId: 'lea',
			username: 'Léa',
			isSelf: false,
			devices: [device('lea-tab', 'Tablette de Léa')],
		},
	],
};

const soundCloudTrack: SoundCloudTrack = {
	id: 7,
	title: 'Song',
	description: null,
	duration: 180_000,
	genre: null,
	artwork_url: null,
	permalink_url: 'https://soundcloud.com/artist/song',
	user: { id: 1, username: 'Artist', avatar_url: null, permalink_url: '' },
	playable: true,
};

const onClose = jest.fn();

const testSessionStore = createStore<SessionView>(() => ({
	user: { id: 'me' } as UserProfile,
	accessToken: 'test-token',
	isAuthenticated: true,
}));

registerAuthSession({
	store: testSessionStore,
	isTokenExpiringSoon: () => false,
	refreshAccessToken: async () => true,
});

const initialPlayerState = usePlayerStore.getState();

async function renderSheet() {
	render(<DevicePickerSheetContainer visible onClose={onClose} />);
	await screen.findByText('Mon PC');
}

beforeEach(() => {
	jest.clearAllMocks();
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	testSessionStore.setState({ user: { id: 'me' } as UserProfile, isAuthenticated: true });
	useQueueStore.getState().reset();
	useConnectStore.setState({
		target: { kind: 'local' },
		remoteStatus: null,
		controlPending: false,
	});
	usePlayerStore.setState(
		{ ...initialPlayerState, currentTrack: soundCloudTrack, queueItemId: 'i1' },
		true
	);
	mockGetDevicePicker.mockResolvedValue(picker);
	transfer.mockResolvedValue({ ownerId: 'me', deviceId: 'pc', queue: null });
});

describe('DevicePickerSheetContainer', () => {
	it('lists this phone, my devices and my friends by owner', async () => {
		await renderSheet();
		for (const text of [
			'Ce téléphone',
			'Mes appareils',
			'Appareils de mes amis',
			'Mon téléphone',
			'Ma tablette',
			'Léa',
			'Tablette de Léa',
		]) {
			expect(screen.getByText(text)).toBeTruthy();
		}
	});

	it('greys out and disables offline devices', async () => {
		await renderSheet();
		expect(screen.getByLabelText('Ma tablette')).toBeDisabled();
		expect(screen.getByText('Hors ligne')).toBeTruthy();
		fireEvent.press(screen.getByLabelText('Ma tablette'));
		expect(transfer).not.toHaveBeenCalled();
	});

	it('marks this phone as active in local mode', async () => {
		await renderSheet();
		expect(screen.getByLabelText('Mon téléphone').props.accessibilityState.selected).toBe(true);
		expect(screen.getByText('En cours')).toBeTruthy();
	});

	it('marks the remote target as active in remote mode', async () => {
		useConnectStore.setState({ target: { kind: 'remote', ownerId: 'lea', deviceId: 'lea-tab' } });
		await renderSheet();
		expect(screen.getByLabelText('Tablette de Léa').props.accessibilityState.selected).toBe(true);
		expect(screen.getByLabelText('Mon téléphone').props.accessibilityState.selected).toBe(false);
	});

	it('ignores a tap on the active device', async () => {
		await renderSheet();
		fireEvent.press(screen.getByLabelText('Mon téléphone'));
		expect(transfer).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});

	it('transfers to the tapped device and closes', async () => {
		await renderSheet();
		fireEvent.press(screen.getByLabelText('Mon PC'));
		await waitFor(() => expect(onClose).toHaveBeenCalled());
		expect(transfer).toHaveBeenCalledWith(
			expect.objectContaining({
				targetUserId: 'me',
				targetDeviceId: 'pc',
				playing: { queueItemId: 'i1' },
			})
		);
		expect(useConnectStore.getState().target).toMatchObject({ kind: 'remote', deviceId: 'pc' });
	});

	it('keeps the target and stays open when the transfer is refused', async () => {
		transfer.mockRejectedValue(new ApiError('offline', 'DEVICE_OFFLINE', undefined, 409));
		await renderSheet();
		fireEvent.press(screen.getByLabelText('Tablette de Léa'));
		await waitFor(() => expect(showError).toHaveBeenCalledWith("Cet appareil n'est plus en ligne"));
		expect(onClose).not.toHaveBeenCalled();
		expect(useConnectStore.getState().target).toStrictEqual({ kind: 'local' });
	});

	it('shows the spinner, not the old list, while reloading on reopen', async () => {
		const view = render(<DevicePickerSheetContainer visible onClose={onClose} />);
		await screen.findByText('Mon PC');
		view.rerender(<DevicePickerSheetContainer visible={false} onClose={onClose} />);
		mockGetDevicePicker.mockReturnValueOnce(new Promise(() => undefined));
		view.rerender(<DevicePickerSheetContainer visible onClose={onClose} />);
		expect(screen.getByTestId('picker-loading')).toBeTruthy();
		expect(screen.queryByText('Mon PC')).toBeNull();
	});

	it('offers a retry when the list fails to load', async () => {
		mockGetDevicePicker.mockRejectedValueOnce(new Error('network'));
		render(<DevicePickerSheetContainer visible onClose={onClose} />);
		fireEvent.press(await screen.findByText('Réessayer'));
		expect(await screen.findByText('Mon PC')).toBeTruthy();
		expect(mockGetDevicePicker).toHaveBeenCalledTimes(2);
	});
});
