import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { EmptyState } from '@/components/common/EmptyState';

jest.mock('@/contexts/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@themes/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

describe('EmptyState', () => {
	it('shows the message without an icon by default', () => {
		render(<EmptyState message="No playlists yet" />);
		expect(screen.getByText('No playlists yet')).toBeTruthy();
		expect(screen.UNSAFE_queryAllByType(Ionicons)).toHaveLength(0);
	});

	it('renders the given icon', async () => {
		render(<EmptyState message="Nothing here" icon="musical-notes" />);
		// Ionicons loads its font asynchronously and re-renders once it is ready.
		await act(async () => {});
		const icons = screen.UNSAFE_queryAllByType(Ionicons);
		expect(icons).toHaveLength(1);
		expect(icons[0].props.name).toBe('musical-notes');
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
