import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { FONT_FAMILIES } from '@/shared/theme/configs/fontsConfig';
import { Text } from '@/shared/theme/components/Text';
import { TextInput } from '@/shared/theme/components/TextInput';
import { originalTheme } from '@/shared/theme/configs/originalThemeConfig';

const INPUT_SIZE = originalTheme.typography.sizes.lg;

const styles = StyleSheet.create({
	bold: { fontFamily: FONT_FAMILIES.bold },
	semibold: { fontFamily: FONT_FAMILIES.semibold },
	input: { fontSize: INPUT_SIZE },
});

function fontOf(testID: string) {
	return StyleSheet.flatten(screen.getByTestId(testID).props.style)?.fontFamily;
}

describe('Text', () => {
	it('sets the regular brand family on an unstyled text', () => {
		render(<Text testID="plain">Hello</Text>);

		expect(fontOf('plain')).toBe(FONT_FAMILIES.regular);
	});

	it('lets the style pick another weight', () => {
		render(
			<Text testID="title" style={styles.bold}>
				Title
			</Text>,
		);

		expect(fontOf('title')).toBe(FONT_FAMILIES.bold);
	});

	it('leaves a nested text to inherit its parent family', () => {
		render(
			<Text style={styles.semibold}>
				Hello <Text testID="nested">Bob</Text>
			</Text>,
		);

		expect(fontOf('nested')).toBeUndefined();
	});
});

describe('TextInput', () => {
	it('sets the regular brand family under the given style', () => {
		render(<TextInput testID="input" style={styles.input} />);

		expect(fontOf('input')).toBe(FONT_FAMILIES.regular);
		expect(StyleSheet.flatten(screen.getByTestId('input').props.style).fontSize).toBe(INPUT_SIZE);
	});
});
