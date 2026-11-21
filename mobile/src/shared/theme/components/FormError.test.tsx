import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { FormError } from '@/shared/theme/components/FormError';

jest.mock('@/shared/theme/hooks/useTheme', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/configs/originalThemeConfig');
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
