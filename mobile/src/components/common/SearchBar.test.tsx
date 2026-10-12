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
