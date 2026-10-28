import React from 'react';
import { Image } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { Artwork } from './Artwork';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

describe('Artwork', () => {
	it('shows the image when there is a uri', () => {
		render(<Artwork uri="https://i1.sndcdn.com/a-large.jpg" size={48} />);
		expect(screen.getByTestId('artwork-image').props.source).toEqual({
			uri: 'https://i1.sndcdn.com/a-large.jpg',
		});
		expect(screen.queryByTestId('artwork-placeholder')).toBeNull();
	});

	it.each([null, undefined, ''])('draws a local placeholder for %p, with no image', async uri => {
		render(<Artwork uri={uri} size={48} />);
		expect(screen.getByTestId('artwork-placeholder')).toBeTruthy();
		expect(screen.UNSAFE_queryAllByType(Image)).toHaveLength(0);
	});
});
