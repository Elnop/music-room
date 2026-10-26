import React from 'react';
import { ScrollView } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { originalTheme } from '@/shared/theme/original.theme';
import { SettingsOrchestrator } from './components/orchestrators/SettingsOrchestrator';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/shared/components/form/BackendUrlField', () => ({
	BackendUrlField: () => null,
}));

describe('SettingsOrchestrator', () => {
	it('renders the server section without a theme picker', () => {
		render(<SettingsOrchestrator />);
		expect(screen.getByText('Serveur')).toBeTruthy();
		expect(screen.queryByText('Thème')).toBeNull();
	});

	it('leaves breathing room under its last section', () => {
		render(<SettingsOrchestrator />);
		expect(screen.UNSAFE_getByType(ScrollView).props.contentContainerStyle).toEqual({
			paddingBottom: originalTheme.spacing.xl,
		});
	});
});
