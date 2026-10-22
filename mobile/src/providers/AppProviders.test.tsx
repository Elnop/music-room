import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { useQueryClient } from '@tanstack/react-query';
import { AppProviders } from './AppProviders';
import { createQueryClient } from '@/shared/query/queryClient';
import { useTheme } from '@/shared/theme/ThemeContext';

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
jest.mock('@/services/deviceService', () => ({ getAppVersion: () => '1.0.0' }));

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
});
