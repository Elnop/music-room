import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Card } from '@/components/common/Card';

jest.mock('@/contexts/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@themes/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

describe('Card', () => {
	it('renders its children', () => {
		render(
			<Card>
				<Text>Content</Text>
			</Card>
		);
		expect(screen.getByText('Content')).toBeTruthy();
	});

	it('calls onPress when pressed', () => {
		const onPress = jest.fn();
		render(
			<Card onPress={onPress}>
				<Text>Content</Text>
			</Card>
		);

		fireEvent.press(screen.getByText('Content'));

		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it('is not pressable without onPress', () => {
		render(
			<Card>
				<Text>Content</Text>
			</Card>
		);
		expect(screen.UNSAFE_queryAllByType(TouchableOpacity)).toHaveLength(0);
	});
});
