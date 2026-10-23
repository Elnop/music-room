import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { useQueryClient } from '@tanstack/react-query';
import { AppProviders } from './AppProviders';
import { createQueryClient } from '@/shared/query/queryClient';
import { useTheme } from '@/shared/theme/ThemeContext';
import { notifySessionEnd } from '@/shared/services/authSession';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('react-native-gesture-handler', () => ({
	...jest.requireActual('react-native-gesture-handler'),
	GestureHandlerRootView: jest.requireActual('react-native').View,
}));
jest.mock('react-native-safe-area-context', () => ({
	SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/shared/services/deviceService', () => ({ getAppVersion: () => '1.0.0' }));

function Probe({ onClient }: { onClient: (client: unknown) => void }) {
	onClient(useQueryClient());
	const { theme } = useTheme();
	return <Text>{theme.name}</Text>;
}

describe('AppProviders', () => {
	it('gives its children the query client and the theme', () => {
		const client = createQueryClient();
		const onClient = jest.fn();

		render(
			<AppProviders queryClient={client}>
				<Probe onClient={onClient} />
			</AppProviders>
		);

		expect(onClient).toHaveBeenCalledWith(client);
		expect(screen.getByText('original')).toBeTruthy();
		client.clear();
	});

	it('creates its own query client when none is given', () => {
		const onClient = jest.fn();

		render(
			<AppProviders>
				<Probe onClient={onClient} />
			</AppProviders>
		);

		expect(onClient.mock.calls[0][0]).toBeDefined();
	});

	it('clears the whole query cache when the session ends', () => {
		const client = createQueryClient();
		client.setQueryData(['playlists', 'friends'], [{ id: 'p1' }]);
		const { unmount } = render(
			<AppProviders queryClient={client}>
				<Text>app</Text>
			</AppProviders>
		);

		notifySessionEnd();
		expect(client.getQueryData(['playlists', 'friends'])).toBeUndefined();

		client.setQueryData(['playlists', 'friends'], [{ id: 'p2' }]);
		unmount();
		notifySessionEnd();
		expect(client.getQueryData(['playlists', 'friends'])).toEqual([{ id: 'p2' }]);
		client.clear();
	});
});
