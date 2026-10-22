import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { FormError } from './FormError';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

describe('FormError', () => {
	it('shows the message', () => {
		render(<FormError message="Invalid email" />);
		expect(screen.getByText('Invalid email')).toBeTruthy();
	});

	it('renders nothing for an empty message', () => {
		render(<FormError message="" />);
		expect(screen.toJSON()).toBeNull();
	});
});
