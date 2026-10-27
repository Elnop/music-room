import React from 'react';
import { Image } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Avatar } from './Avatar';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

describe('Avatar', () => {
	it('shows the initials of the first two words', () => {
		render(<Avatar name="john doe" />);
		expect(screen.getByText('JD')).toBeTruthy();
	});

	it('shows one upper-cased letter for a single word', () => {
		render(<Avatar name="alice" />);
		expect(screen.getByText('A')).toBeTruthy();
	});

	it('shows a question mark without a name', () => {
		render(<Avatar />);
		expect(screen.getByText('?')).toBeTruthy();
	});

	it('shows the initials until the image has loaded', () => {
		render(<Avatar uri="https://example.com/a.png" name="John Doe" />);
		const image = screen.UNSAFE_getByType(Image);
		expect(image.props.source).toEqual({ uri: 'https://example.com/a.png' });
		expect(screen.getByText('JD')).toBeTruthy();

		fireEvent(image, 'load');
		expect(screen.queryByText('JD')).toBeNull();
	});

	it('falls back to the initials when the image fails', () => {
		render(<Avatar uri="https://example.com/broken.png" name="John Doe" />);
		fireEvent(screen.UNSAFE_getByType(Image), 'error');
		expect(screen.queryByText('JD')).toBeTruthy();
		expect(screen.UNSAFE_queryByType(Image)).toBeNull();
	});
});
