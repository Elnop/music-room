import React from 'react';
import { ActivityIndicator } from 'react-native';
import { EqualizerBars } from '@/shared/components/media/EqualizerBars';
import { render, screen } from '@testing-library/react-native';
import { LoadingSpinner } from './LoadingSpinner';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

describe('LoadingSpinner', () => {
	it('bounces the pixel equalizer by default', () => {
		render(<LoadingSpinner />);
		expect(screen.UNSAFE_queryAllByType(EqualizerBars)).toHaveLength(1);
		expect(screen.UNSAFE_queryAllByType(ActivityIndicator)).toHaveLength(0);
	});

	it('renders an ActivityIndicator for the spinner variant', () => {
		render(<LoadingSpinner variant="spinner" />);
		expect(screen.UNSAFE_queryAllByType(ActivityIndicator)).toHaveLength(1);
		expect(screen.UNSAFE_queryAllByType(EqualizerBars)).toHaveLength(0);
	});

	it.each(['logo', 'spinner'] as const)('shows the message with the %s variant', variant => {
		render(<LoadingSpinner variant={variant} message="Loading playlists" />);
		expect(screen.getByText('Loading playlists')).toBeTruthy();
	});

	it('stops its animations on unmount without error', () => {
		const { unmount } = render(<LoadingSpinner />);
		expect(() => unmount()).not.toThrow();
	});
});
