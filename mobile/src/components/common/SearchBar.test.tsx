import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SearchBar } from '@/components/common/SearchBar';

jest.mock('@/contexts/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@themes/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

describe('SearchBar', () => {
	it('shows the value and the default placeholder', () => {
		render(<SearchBar value="daft" onChangeText={jest.fn()} />);
		expect(screen.getByPlaceholderText('Search...').props.value).toBe('daft');
	});

	it('uses a custom placeholder', () => {
		render(<SearchBar value="" onChangeText={jest.fn()} placeholder="Find a track" />);
		expect(screen.getByPlaceholderText('Find a track')).toBeTruthy();
	});

	it('calls onChangeText when typing', () => {
		const onChangeText = jest.fn();
		render(<SearchBar value="" onChangeText={onChangeText} />);

		fireEvent.changeText(screen.getByPlaceholderText('Search...'), 'punk');

		expect(onChangeText).toHaveBeenCalledWith('punk');
	});
});

describe('SearchBar clear and loading (#307)', () => {
	it('has no clear button while the field is empty', () => {
		render(<SearchBar value="" onChangeText={jest.fn()} />);
		expect(screen.queryByLabelText('Effacer la recherche')).toBeNull();
	});

	it('clears the field through onChangeText', () => {
		const onChangeText = jest.fn();
		render(<SearchBar value="punk" onChangeText={onChangeText} />);

		fireEvent.press(screen.getByLabelText('Effacer la recherche'));

		expect(onChangeText).toHaveBeenCalledWith('');
	});

	it('shows a spinner only while loading', () => {
		const { rerender } = render(<SearchBar value="punk" onChangeText={jest.fn()} />);
		expect(screen.queryByTestId('search-bar-loading')).toBeNull();

		rerender(<SearchBar value="punk" onChangeText={jest.fn()} loading />);

		expect(screen.getByTestId('search-bar-loading')).toBeTruthy();
	});
});
