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

jest.mock('@/shared/services/playbackBridge', () => ({
	usePlayerHeight: () => 90,
}));

jest.mock('@/shared/components/theme/ThemeSelector', () => ({
	ThemeSelector: () => null,
}));

jest.mock('@/shared/components/form/BackendUrlField', () => ({
	BackendUrlField: () => null,
}));

describe('SettingsOrchestrator', () => {
	it('renders theme and server sections', () => {
		render(<SettingsOrchestrator />);
		expect(screen.getByText('Thème')).toBeTruthy();
		expect(screen.getByText('Serveur')).toBeTruthy();
	});

	it('scrolls its last section clear of the mini-player', () => {
		render(<SettingsOrchestrator />);
		expect(screen.UNSAFE_getByType(ScrollView).props.contentContainerStyle).toEqual({
			paddingBottom: 90 + originalTheme.spacing.xl,
		});
	});
});
