import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { EmptyState } from './EmptyState';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

describe('EmptyState', () => {
	it('shows the message without an icon by default', () => {
		render(<EmptyState message="No playlists yet" />);
		expect(screen.getByText('No playlists yet')).toBeTruthy();
		expect(screen.UNSAFE_queryAllByType(PixelIcon)).toHaveLength(0);
	});

	it('renders the given icon', () => {
		render(<EmptyState message="Nothing here" icon="note" />);
		const icons = screen.UNSAFE_queryAllByType(PixelIcon);
		expect(icons).toHaveLength(1);
		expect(icons[0].props.name).toBe('note');
	});

	it('has no button without an action', () => {
		render(<EmptyState message="Rien ici" />);
		expect(screen.queryByRole('button')).toBeNull();
	});

	it('renders the action as a button that calls onPress', () => {
		const onPress = jest.fn();
		render(
			<EmptyState message="Aucune playlist" action={{ label: 'Créer une playlist', onPress }} />
		);
		fireEvent.press(screen.getByRole('button', { name: 'Créer une playlist' }));
		expect(onPress).toHaveBeenCalledTimes(1);
	});
});
