import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { DevicePickerSheet } from './DevicePickerSheet';
import { useConnectStore } from '@/store/connectStore';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { useQueueStore } from '@/store/queueStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { musicControlApi } from '@/services/musicControlApi';
import { queueApi } from '@/services/queueApi';
import { ApiError } from '@/shared/services/api';
import { showError } from '@/shared/utils/toast';
import type { DevicePickerResponse } from '@/types/device.types';
import type { UserProfile } from '@/types/user.types';
import { logger } from '@/shared/utils/logger';


jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
	deviceService: { getDeviceInfo: jest.fn(async () => ({ deviceId: 'phone' })) },
}));

jest.mock('@/services/musicControlApi', () => ({
	musicControlApi: { getDevicePicker: jest.fn() },
}));

jest.mock('@/services/queueApi', () => ({
	queueApi: { getQueue: jest.fn(), transfer: jest.fn() },
}));

jest.mock('@/features/player/context/PlayerContext', () => ({
	usePlayer: () => ({ player: null, error: null }),
}));

jest.mock('@/shared/utils/toast', () => ({
	showSuccess: jest.fn(),
	showError: jest.fn(),
	showInfo: jest.fn(),
}));

const getDevicePicker = musicControlApi.getDevicePicker as jest.Mock;
const transfer = queueApi.transfer as jest.Mock;

const device = (deviceId: string, deviceName: string, online = true) => ({
	deviceId,
	deviceName,
	platform: 'android',
	model: 'Model',
	lastSeenAt: '2026-10-15T00:00:00Z',
	access: 'all-devices' as const,
	online,
});

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

const soundCloudTrack = {
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

const renderSheet = async () => {
	render(<DevicePickerSheet visible onClose={onClose} />);
	await screen.findByText('Mon PC');
};

beforeEach(() => {
	jest.clearAllMocks();
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	useAuthStore.setState({ user: { id: 'me' } as UserProfile, isAuthenticated: true });
	useQueueStore.getState().reset();
	useConnectStore.setState({
		target: { kind: 'local' },
		remoteStatus: null,
		controlPending: false,
	});
	usePlayerStore.setState({ currentTrack: soundCloudTrack, queueItemId: 'i1', stop: jest.fn() });
	getDevicePicker.mockResolvedValue(picker);
	transfer.mockResolvedValue({ ownerId: 'me', deviceId: 'pc', queue: null });
});

describe('DevicePickerSheet', () => {
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
		expect(useConnectStore.getState().target).toEqual({ kind: 'local' });
	});

	it('shows the spinner, not the old list, while reloading on reopen', async () => {
		const view = render(<DevicePickerSheet visible onClose={onClose} />);
		await screen.findByText('Mon PC');
		view.rerender(<DevicePickerSheet visible={false} onClose={onClose} />);
		getDevicePicker.mockReturnValueOnce(new Promise(() => undefined));
		view.rerender(<DevicePickerSheet visible onClose={onClose} />);
		expect(screen.getByTestId('picker-loading')).toBeTruthy();
		expect(screen.queryByText('Mon PC')).toBeNull();
	});

	it('offers a retry when the list fails to load', async () => {
		getDevicePicker.mockRejectedValueOnce(new Error('network'));
		render(<DevicePickerSheet visible onClose={onClose} />);
		fireEvent.press(await screen.findByText('Réessayer'));
		expect(await screen.findByText('Mon PC')).toBeTruthy();
		expect(getDevicePicker).toHaveBeenCalledTimes(2);
	});
});
