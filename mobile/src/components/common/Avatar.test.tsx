import React from 'react';
import { Image } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Avatar } from '@/components/common/Avatar';

jest.mock('@/contexts/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@themes/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

describe('Avatar', () => {
	it('shows the initials of the first two words', () => {
		render(<Avatar name="john doe" />);
		expect(screen.getByText('JD')).toBeTruthy();
	});

	it('shows the first two letters upper-cased for a single word', () => {
		render(<Avatar name="alice" />);
		expect(screen.getByText('AL')).toBeTruthy();
	});

	it('shows a question mark without a name', () => {
		render(<Avatar />);
		expect(screen.getByText('?')).toBeTruthy();
	});

	it('renders the image instead of initials when a uri is given', () => {
		render(<Avatar uri="https://example.com/a.png" name="John Doe" />);
		expect(screen.UNSAFE_getByType(Image).props.source).toEqual({
			uri: 'https://example.com/a.png',
		});
		expect(screen.queryByText('JD')).toBeNull();
	});
});
