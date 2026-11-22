import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Card } from '@/shared/theme/components/Card';
import { Text } from '@/shared/theme/components/Text';

jest.mock('@/shared/theme/hooks/useTheme', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/configs/originalThemeConfig');
	return { useTheme: () => ({ theme: originalTheme }) };
});

describe('Card', () => {
	it('renders its children', () => {
		render(
			<Card>
				<Text>Content</Text>
			</Card>,
		);
		expect(screen.getByText('Content')).toBeTruthy();
	});

	it('calls onPress when pressed', () => {
		const onPress = jest.fn();
		render(
			<Card onPress={onPress} accessibilityLabel="Open">
				<Text>Content</Text>
			</Card>,
		);

		fireEvent.press(screen.getByRole('button', { name: 'Open' }));

		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it('is not pressable without onPress', () => {
		render(
			<Card>
				<Text>Content</Text>
			</Card>,
		);
		expect(screen.queryByRole('button')).toBeNull();
	});
});
