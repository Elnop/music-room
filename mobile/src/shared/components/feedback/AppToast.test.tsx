import React from 'react';
import { StyleSheet } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import Toast from 'react-native-toast-message';
import { AppToast } from './AppToast';
import { originalTheme } from '@/shared/theme/original.theme';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme: theme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme }) };
});

describe('AppToast', () => {
	it.each(['success', 'error', 'info', 'warning'] as const)(
		'renders a %s toast with its message in the theme colours',
		async type => {
			render(<AppToast />);

			await act(async () => {
				Toast.show({ type, text1: `Message ${type}` });
			});

			expect(screen.getByText(`Message ${type}`)).toBeTruthy();
			const toast = screen.getByTestId(`toast-${type}`);
			const style = StyleSheet.flatten(toast.props.style);
			expect(style.borderColor).toBe(originalTheme.colors[type]);
			expect(style.backgroundColor).toBe(originalTheme.colors.surface);
			const text = StyleSheet.flatten(screen.getByText(`Message ${type}`).props.style);
			expect(text.color).toBe(originalTheme.colors.text);
		}
	);
});
