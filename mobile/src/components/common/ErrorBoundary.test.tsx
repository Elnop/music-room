import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { logger } from '@/utils/logger';

let shouldThrow = false;

function Child() {
	if (shouldThrow) throw new Error('Kaboom');
	return <Text>Child content</Text>;
}

beforeEach(() => {
	shouldThrow = false;
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('ErrorBoundary', () => {
	it('renders its children when nothing throws', () => {
		render(
			<ErrorBoundary>
				<Child />
			</ErrorBoundary>
		);
		expect(screen.getByText('Child content')).toBeTruthy();
		expect(screen.queryByText("Une erreur s'est produite")).toBeNull();
	});

	it('shows the fallback with the message and recovers on Try Again', () => {
		jest.spyOn(logger, 'error').mockImplementation(() => undefined);
		// Mutes React's own log of the caught error, not app logging.
		const reactLog = jest.spyOn(console, 'error').mockImplementation(() => {});
		shouldThrow = true;

		render(
			<ErrorBoundary>
				<Child />
			</ErrorBoundary>
		);

		expect(screen.getByText("Une erreur s'est produite")).toBeTruthy();
		expect(screen.getByText('Kaboom')).toBeTruthy();
		expect(screen.queryByText('Child content')).toBeNull();

		shouldThrow = false;
		fireEvent.press(screen.getByText('Réessayer'));

		expect(screen.getByText('Child content')).toBeTruthy();
		expect(screen.queryByText("Une erreur s'est produite")).toBeNull();
		reactLog.mockRestore();
	});
});
