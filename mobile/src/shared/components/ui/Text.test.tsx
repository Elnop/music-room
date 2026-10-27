import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { FONT_FAMILIES } from '@/shared/theme/fonts';
import { Text } from './Text';
import { TextInput } from './TextInput';

const fontOf = (testID: string) =>
	StyleSheet.flatten(screen.getByTestId(testID).props.style)?.fontFamily;

describe('Text', () => {
	it('sets the regular Inter family on an unstyled text', () => {
		render(<Text testID="plain">Hello</Text>);

		expect(fontOf('plain')).toBe(FONT_FAMILIES.regular);
	});

	it('lets the style pick another weight', () => {
		render(
			<Text testID="title" style={{ fontFamily: FONT_FAMILIES.bold }}>
				Title
			</Text>
		);

		expect(fontOf('title')).toBe(FONT_FAMILIES.bold);
	});

	it('leaves a nested text to inherit its parent family', () => {
		render(
			<Text style={{ fontFamily: FONT_FAMILIES.semibold }}>
				Hello <Text testID="nested">Bob</Text>
			</Text>
		);

		expect(fontOf('nested')).toBeUndefined();
	});
});

describe('TextInput', () => {
	it('sets the regular Inter family under the given style', () => {
		render(<TextInput testID="input" style={{ fontSize: 18 }} />);

		expect(fontOf('input')).toBe(FONT_FAMILIES.regular);
		expect(StyleSheet.flatten(screen.getByTestId('input').props.style).fontSize).toBe(18);
	});
});
