import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { FormError } from '@/components/common/FormError';

jest.mock('@/contexts/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@themes/original.theme');
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
