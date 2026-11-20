import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ConnectionBanner } from './ConnectionBanner';
import { textColorOn } from '@/features/shell/lib/textContrast';
import { FIXED_COLORS } from '@/shared/theme/lib/tokens';
import { originalTheme } from '@/shared/theme/lib/original.theme';

const retry = jest.fn();

jest.mock('@/shared/theme/components/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/lib/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

beforeEach(() => {
	jest.clearAllMocks();
});

describe('ConnectionBanner', () => {
	it('renders nothing without a status', () => {
		render(<ConnectionBanner status={null} topInset={24} onRetry={retry} />);
		expect(screen.toJSON()).toBeNull();
	});

	it('shows « Hors ligne » when offline, without a retry button', () => {
		render(<ConnectionBanner status="offline" topInset={24} onRetry={retry} />);
		expect(screen.getByText('Hors ligne')).toBeTruthy();
		expect(screen.queryByText('Réessayer')).toBeNull();
		expect(screen.getByTestId('connection-banner').props.accessibilityRole).toBe('alert');
	});

	it('shows « Reconnexion… » while reconnecting, without a retry button', () => {
		render(<ConnectionBanner status="reconnecting" topInset={24} onRetry={retry} />);
		expect(screen.getByText('Reconnexion…')).toBeTruthy();
		expect(screen.queryByText('Réessayer')).toBeNull();
	});

	it('shows « Connexion perdue » and retries on « Réessayer »', () => {
		render(<ConnectionBanner status="failed" topInset={24} onRetry={retry} />);
		expect(screen.getByText('Connexion perdue')).toBeTruthy();

		fireEvent.press(screen.getByRole('button', { name: 'Réessayer' }));

		expect(retry).toHaveBeenCalledTimes(1);
	});

	it('sits under the status bar', () => {
		render(<ConnectionBanner status="offline" topInset={24} onRetry={retry} />);
		expect(screen.getByTestId('connection-banner')).toHaveStyle({ paddingTop: 24 });
	});

	it('picks a readable text color on the background', () => {
		render(<ConnectionBanner status="failed" topInset={0} onRetry={retry} />);
		// Default theme error: white would be 3.8:1, dark text is 5:1.
		expect(screen.getByText('Connexion perdue')).toHaveStyle({ color: FIXED_COLORS.inkDark });
	});
});

describe('textColorOn', () => {
	it.each([
		[originalTheme.colors.error, FIXED_COLORS.inkDark],
		[originalTheme.colors.warning, FIXED_COLORS.inkDark],
	])('uses %s → %s (at least 4.5:1)', (background, text) => {
		expect(textColorOn(background)).toBe(text);
	});
});
