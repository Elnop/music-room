import React from 'react';
import { StyleSheet, View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Header, HeaderBackButton } from '@react-navigation/elements';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { AlignedHeader } from './AlignedHeader';

jest.mock('@react-navigation/elements', () => {
	const actual = jest.requireActual('@react-navigation/elements');
	return { ...actual, Header: jest.fn(() => null) };
});

const goBack = jest.fn();

function headerProps(
	name: string,
	options: NativeStackHeaderProps['options'] = {}
): NativeStackHeaderProps {
	return {
		options: { title: 'Titre', ...options },
		back: { title: 'Retour', href: undefined },
		route: { key: `${name}-1`, name },
		navigation: { goBack },
	} as unknown as NativeStackHeaderProps;
}

function lastHeader() {
	const calls = jest.mocked(Header).mock.calls;
	return calls[calls.length - 1][0];
}

beforeEach(() => {
	jest.mocked(Header).mockClear();
	goBack.mockReset();
});

describe('AlignedHeader', () => {
	it("lays the header out in the screen's column, on the header's background", () => {
		render(
			<AlignedHeader
				{...headerProps('Login', { headerStyle: { backgroundColor: 'transparent' } })}
			/>
		);

		const [row, column] = screen.UNSAFE_getAllByType(View);
		expect(StyleSheet.flatten(row.props.style).backgroundColor).toBe('transparent');
		expect(StyleSheet.flatten(column.props.style).maxWidth).toBe(600);
		expect(lastHeader().title).toBe('Titre');
	});

	it('leaves a screen without a column at full width', () => {
		render(<AlignedHeader {...headerProps('Welcome')} />);

		const [, column] = screen.UNSAFE_getAllByType(View);
		expect(StyleSheet.flatten(column.props.style).maxWidth).toBeUndefined();
	});

	it('draws a back button that goes back, and keeps a screen-set left button', () => {
		render(<AlignedHeader {...headerProps('EditProfile')} />);
		const { headerLeft } = lastHeader();
		if (typeof headerLeft !== 'function') throw new Error('no back button');
		const back = headerLeft({ canGoBack: true, label: 'Retour' }) as React.ReactElement<{
			onPress: () => void;
		}>;
		expect(back.type).toBe(HeaderBackButton);
		expect(back.props.onPress).toBe(goBack);

		const custom = jest.fn(() => null);
		render(<AlignedHeader {...headerProps('Profile', { headerLeft: custom })} />);
		const left = lastHeader().headerLeft;
		if (typeof left !== 'function') throw new Error('no left button');
		left({ canGoBack: true, label: 'Retour' });
		expect(custom).toHaveBeenCalledWith(expect.objectContaining({ label: 'Retour' }));
	});
});
